# AssignArea Backend & Security Implementation

## Current Status
✅ **Frontend**: Complete - All role hierarchy and UI working
⚠️ **Backend**: Needs Authorization Middleware

## Backend Authorization Requirements

### 1. Role Hierarchy Validation Middleware

**File to create**: `backend/middleware/rbacAuthMiddleware.js`

```javascript
/**
 * RBAC Authorization Middleware
 * Validates role hierarchy and geographic permissions
 * 
 * Hierarchy: General (4) > Sub-General (3) > HR-General (2) > Salesman (1)
 */

const ROLE_HIERARCHY = {
  'general': 4,
  'sub-general': 3,
  'hr-general': 2,
  'salesman': 1
};

/**
 * Validate that the authenticated user's role can manage the target role
 * 
 * Example:
 * - General can manage Sub-General ✅
 * - Sub-General can manage HR-General ✅
 * - Sub-General cannot manage Sub-General ❌
 * - HR-General cannot manage Sub-General ❌
 */
export const validateRoleManagement = (req, res, next) => {
  const userRole = req.user?.role;
  const targetRole = req.body?.role || req.query?.role;
  
  if (!userRole || !targetRole) {
    return res.status(400).json({ 
      error: 'Missing role information' 
    });
  }
  
  const userLevel = ROLE_HIERARCHY[userRole];
  const targetLevel = ROLE_HIERARCHY[targetRole];
  
  // User must have higher level than target
  if (userLevel <= targetLevel) {
    return res.status(403).json({ 
      error: 'Cannot manage role of equal or higher level',
      userRole,
      targetRole
    });
  }
  
  next();
};

/**
 * Validate geographic permissions
 * - General can manage any cities
 * - Sub-General can only manage assigned cities
 * - HR-General can only manage assigned talukas
 */
export const validateGeographicPermissions = async (req, res, next) => {
  const userRole = req.user?.role;
  const userId = req.user?.id;
  
  if (userRole === 'general') {
    // General has no geographic restrictions
    return next();
  }
  
  if (userRole === 'sub-general') {
    // Fetch Sub-General's assigned cities
    const { data: assignment } = await supabase
      .from('user_role_assignments')
      .select('assigned_cities')
      .eq('user_id', userId)
      .eq('role', 'sub-general')
      .single();
    
    const requestedCities = req.body?.assigned_cities;
    
    if (!assignment?.assigned_cities) {
      return res.status(403).json({ 
        error: 'No cities assigned to this Sub-General' 
      });
    }
    
    // Check if all requested cities are in assigned cities
    const hasAllCities = requestedCities?.every(city => 
      assignment.assigned_cities.includes(city)
    );
    
    if (!hasAllCities) {
      return res.status(403).json({ 
        error: 'Cannot assign cities outside your jurisdiction',
        yourCities: assignment.assigned_cities,
        requestedCities
      });
    }
  }
  
  if (userRole === 'hr-general') {
    // Fetch HR-General's assigned talukas
    const { data: assignment } = await supabase
      .from('user_role_assignments')
      .select('assigned_talukas')
      .eq('user_id', userId)
      .eq('role', 'hr-general')
      .single();
    
    const requestedTalukas = req.body?.assigned_talukas;
    
    if (!assignment?.assigned_talukas) {
      return res.status(403).json({ 
        error: 'No talukas assigned to this HR-General' 
      });
    }
    
    // Check if all requested talukas are in assigned talukas
    const hasAllTalukas = requestedTalukas?.every(taluka => 
      assignment.assigned_talukas.includes(taluka)
    );
    
    if (!hasAllTalukas) {
      return res.status(403).json({ 
        error: 'Cannot assign talukas outside your jurisdiction',
        yourTalukas: assignment.assigned_talukas,
        requestedTalukas
      });
    }
  }
  
  next();
};
```

### 2. API Endpoint Protection

**Apply middleware to these endpoints**:

```javascript
// routes/assignAreaRoutes.js

router.post('/assign-city', 
  authenticateUser,
  validateRole(['general']),
  validateRoleManagement,
  async (req, res) => {
    // Assign cities to Sub-General
  }
);

router.post('/assign-taluka',
  authenticateUser,
  validateRole(['sub-general']),
  validateRoleManagement,
  validateGeographicPermissions,
  async (req, res) => {
    // Assign talukas to HR-General
  }
);

router.post('/assign-area',
  authenticateUser,
  validateRole(['hr-general']),
  validateRoleManagement,
  validateGeographicPermissions,
  async (req, res) => {
    // Assign areas to Sales Person
  }
);
```

## Database Schema Verification

### Required Tables

#### 1. `profiles` Table
```sql
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  employee_type VARCHAR(50) CHECK (
    employee_type IN ('general', 'sub-general', 'hr-general', 'salesman', 'customer')
  ),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX idx_profiles_employee_type ON profiles(employee_type);
CREATE INDEX idx_profiles_email ON profiles(email);
```

#### 2. `user_role_assignments` Table
```sql
CREATE TABLE IF NOT EXISTS user_role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (
    role IN ('general', 'sub-general', 'hr-general', 'salesman')
  ),
  assigned_cities TEXT[] DEFAULT NULL,
  assigned_talukas TEXT[] DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX idx_user_role_assignments_role ON user_role_assignments(role);
CREATE INDEX idx_user_role_assignments_user_id ON user_role_assignments(user_id);
CREATE INDEX idx_user_role_assignments_cities ON user_role_assignments USING GIN(assigned_cities);
CREATE INDEX idx_user_role_assignments_talukas ON user_role_assignments USING GIN(assigned_talukas);
```

#### 3. `role_assignment_audit` Table (For Tracking Changes)
```sql
CREATE TABLE IF NOT EXISTS role_assignment_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  old_role VARCHAR(50),
  new_role VARCHAR(50),
  old_cities TEXT[],
  new_cities TEXT[],
  old_talukas TEXT[],
  new_talukas TEXT[],
  action VARCHAR(50) NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Index for audit queries
CREATE INDEX idx_audit_user_id ON role_assignment_audit(user_id);
CREATE INDEX idx_audit_timestamp ON role_assignment_audit(timestamp);
CREATE INDEX idx_audit_assigned_by ON role_assignment_audit(assigned_by);
```

## API Endpoints to Implement

### 1. Assign Cities to Sub-General
```
POST /api/admin/assign-cities
Authorization: Bearer {token}

Request Body:
{
  "sub_general_id": "uuid",
  "cities": ["Ahmedabad", "Vadodara", "Bharuch"]
}

Response (Success):
{
  "success": true,
  "message": "Cities assigned successfully",
  "assignment": {
    "user_id": "uuid",
    "role": "sub-general",
    "assigned_cities": ["Ahmedabad", "Vadodara", "Bharuch"],
    "updated_at": "2024-01-15T10:30:00Z"
  }
}

Response (Error):
{
  "success": false,
  "error": "Cannot assign cities outside your jurisdiction"
}
```

### 2. Assign Talukas to HR-General
```
POST /api/admin/assign-talukas
Authorization: Bearer {token}

Request Body:
{
  "hr_general_id": "uuid",
  "talukas": ["Ankleshwar", "Jhagadia", "Amod"]
}

Response (Success):
{
  "success": true,
  "message": "Talukas assigned successfully",
  "assignment": {
    "user_id": "uuid",
    "role": "hr-general",
    "assigned_talukas": ["Ankleshwar", "Jhagadia", "Amod"],
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

### 3. Assign Areas to Sales Person
```
POST /api/admin/assign-areas
Authorization: Bearer {token}

Request Body:
{
  "sales_person_id": "uuid",
  "areas": ["Ankleshwar", "Khambhat"]
}

Response (Success):
{
  "success": true,
  "message": "Areas assigned successfully",
  "assignment": {
    "user_id": "uuid",
    "role": "salesman",
    "assigned_talukas": ["Ankleshwar", "Khambhat"],
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

### 4. Get Subordinate Users by Role
```
GET /api/admin/subordinates/{role}
Authorization: Bearer {token}
Query: ?city=Bharuch&taluka=Ankleshwar

Response:
{
  "success": true,
  "count": 5,
  "subordinates": [
    {
      "user_id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "sub-general",
      "assigned_cities": ["Ahmedabad"],
      "assigned_talukas": null
    }
  ]
}
```

### 5. Get User Assignments (Audit)
```
GET /api/admin/assignments/{user_id}
Authorization: Bearer {token}

Response:
{
  "success": true,
  "current": {
    "role": "sub-general",
    "assigned_cities": ["Bharuch", "Narmada"]
  },
  "history": [
    {
      "timestamp": "2024-01-10T14:20:00Z",
      "action": "update",
      "old_cities": ["Bharuch"],
      "new_cities": ["Bharuch", "Narmada"],
      "assigned_by": "admin@company.com"
    }
  ]
}
```

## Row-Level Security (RLS) Policies

### For `user_role_assignments` Table

```sql
-- Allow General to see all assignments
CREATE POLICY "general_view_all" ON user_role_assignments
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'general'
  );

-- Allow Sub-General to see assignments in their cities
CREATE POLICY "subgeneral_view_own" ON user_role_assignments
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'sub-general' AND
    auth.jwt() ->> 'assigned_cities' && assigned_cities
  );

-- Allow HR-General to see assignments in their talukas
CREATE POLICY "hrgeneral_view_own" ON user_role_assignments
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'hr-general' AND
    auth.jwt() ->> 'assigned_talukas' && assigned_talukas
  );

-- Allow creating assignments (General, Sub-General, HR-General)
CREATE POLICY "create_assignments" ON user_role_assignments
  FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' IN ('general', 'sub-general', 'hr-general')
  );

-- Allow updating own role (only by higher roles)
CREATE POLICY "update_assignments" ON user_role_assignments
  FOR UPDATE
  USING (
    auth.jwt() ->> 'role' != 'salesman'
  );

-- Allow deleting assignments (only higher roles)
CREATE POLICY "delete_assignments" ON user_role_assignments
  FOR DELETE
  USING (
    auth.jwt() ->> 'role' != 'salesman'
  );
```

## Authentication Middleware

```javascript
// middleware/auth.js

export const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    // Verify token with Supabase
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    // Get user profile with role
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, employee_type')
      .eq('id', data.user.id)
      .single();
    
    if (!profile) {
      return res.status(404).json({ error: 'User profile not found' });
    }
    
    // Attach user to request
    req.user = {
      id: data.user.id,
      email: data.user.email,
      role: profile.employee_type
    };
    
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

export const validateRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user?.role)) {
      return res.status(403).json({ 
        error: `This action requires one of: ${allowedRoles.join(', ')}`,
        yourRole: req.user?.role
      });
    }
    next();
  };
};
```

## Audit Trail

### Log Every Assignment Change

```javascript
// utils/auditLog.js

export const logAssignmentChange = async (
  userId, 
  oldAssignment, 
  newAssignment, 
  assignedBy, 
  action
) => {
  try {
    await supabase
      .from('role_assignment_audit')
      .insert({
        user_id: userId,
        assigned_by: assignedBy,
        old_role: oldAssignment?.role,
        new_role: newAssignment?.role,
        old_cities: oldAssignment?.assigned_cities,
        new_cities: newAssignment?.assigned_cities,
        old_talukas: oldAssignment?.assigned_talukas,
        new_talukas: newAssignment?.assigned_talukas,
        action,
        timestamp: new Date().toISOString(),
        ip_address: req.ip,
        user_agent: req.get('user-agent')
      });
  } catch (error) {
    console.error('Audit logging failed:', error);
    // Don't fail the main operation if audit fails
  }
};
```

## Security Checklist

- [ ] All API endpoints require authentication
- [ ] Role hierarchy is enforced on backend
- [ ] Geographic permissions validated on backend
- [ ] Audit trail for all changes
- [ ] Rate limiting on sensitive endpoints
- [ ] Input validation on all fields
- [ ] SQL injection protection (use parameterized queries)
- [ ] CORS properly configured
- [ ] HTTPS enforced
- [ ] Sensitive data not logged
- [ ] Regular security audits
- [ ] Backup and disaster recovery plan

## Testing

### Unit Tests Example

```javascript
// test/rbac.test.js

describe('RBAC Authorization', () => {
  test('General can manage Sub-General', () => {
    const userLevel = ROLE_HIERARCHY['general'];
    const targetLevel = ROLE_HIERARCHY['sub-general'];
    expect(userLevel > targetLevel).toBe(true);
  });

  test('Sub-General cannot manage General', () => {
    const userLevel = ROLE_HIERARCHY['sub-general'];
    const targetLevel = ROLE_HIERARCHY['general'];
    expect(userLevel > targetLevel).toBe(false);
  });

  test('Geographic validation works', async () => {
    const userCities = ['Bharuch', 'Narmada'];
    const requestedCities = ['Bharuch', 'Surat'];
    
    const hasAllCities = requestedCities.every(city => 
      userCities.includes(city)
    );
    
    expect(hasAllCities).toBe(false); // Surat not in user's cities
  });
});
```

## Monitoring & Alerts

Set up alerts for:
- Multiple failed assignment attempts (potential security issue)
- Assignment changes outside business hours
- Mass assignment operations
- Unusual geographic assignments
- Unauthorized role access attempts

## Documentation

Create endpoint documentation:
- OpenAPI/Swagger documentation
- Postman collection
- Example requests/responses
- Error codes and meanings
- Rate limits and quotas

## Implementation Timeline

1. **Week 1**: Create middleware and validation
2. **Week 2**: Implement audit logging
3. **Week 3**: Add RLS policies
4. **Week 4**: Testing and security review
5. **Week 5**: Production deployment

## Support

For backend implementation questions, refer to:
- [Supabase Documentation](https://supabase.com/docs)
- [Express.js Middleware Guide](https://expressjs.com/en/guide/using-middleware.html)
- [PostgreSQL RLS Guide](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
