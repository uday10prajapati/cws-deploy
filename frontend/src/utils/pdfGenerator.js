import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generate Invoice PDF for Transaction
 * @param {Object} transaction - Transaction data
 * @param {Object} userInfo - User information {name, email, phone, type}
 * @param {string} userType - 'customer', 'employee', or 'admin'
 */
export const generateTransactionPDF = async (transaction, userInfo, userType = 'customer') => {
  try {
    // Create a temporary container for HTML to PDF conversion
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '800px';
    container.style.backgroundColor = '#ffffff';
    container.style.padding = '40px';
    container.style.fontFamily = 'Arial, sans-serif';
    
    const gstNumber = "18AABCT1234H1Z0";
    const companyName = "CarWash+ Services";
    const companyPhone = "+91-1234567890";
    const companyEmail = "support@carwash.com";
    
    // Format amount
    const formatAmount = (amount) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
      }).format(amount);
    };
    
    // Format date
    const formatDate = (dateStr) => {
      return new Date(dateStr).toLocaleString('en-IN', {
        dateStyle: 'long',
        timeStyle: 'medium',
      });
    };
    
    // Determine transaction type label
    const typeLabels = {
      booking: 'Booking Payment',
      monthly_pass_purchase: 'Monthly Pass Purchase',
      wallet: 'Wallet Top-up',
      payment: 'General Payment',
      pass: 'Pass Purchase',
    };
    
    const paymentMethodLabels = {
      upi: 'UPI',
      card: 'Credit/Debit Card',
      wallet: 'Wallet',
      netbanking: 'Net Banking',
      other: 'Other',
    };
    
    // Calculate GST components
    const baseAmount = transaction.amount || 0;
    const gstAmount = transaction.gst || 0;
    const totalAmount = transaction.total_amount || transaction.amount || 0;
    
    // Generate Invoice HTML
    const invoiceHTML = `
      <div style="background: #f8f9fa; padding: 0;">
        <!-- Header with Company Info -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; margin: -40px -40px 30px -40px; border-bottom: 3px solid #764ba2;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <h1 style="margin: 0; font-size: 32px; font-weight: bold;">${companyName}</h1>
              <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">INVOICE</p>
            </div>
            <div style="text-align: right; font-size: 12px; line-height: 1.6;">
              <p style="margin: 0;"><strong>Invoice #:</strong> ${transaction.id.substring(0, 12).toUpperCase()}</p>
              <p style="margin: 5px 0 0 0;"><strong>Date:</strong> ${formatDate(transaction.created_at).split(',')[0]}</p>
              <p style="margin: 5px 0 0 0;"><strong>Time:</strong> ${formatDate(transaction.created_at).split(',')[1]}</p>
            </div>
          </div>
        </div>

        <!-- Company and Customer Details -->
        <div style="display: flex; justify-content: space-between; margin-bottom: 30px; gap: 40px;">
          <!-- Company Details -->
          <div style="flex: 1; padding: 15px; background: #f0f0f0; border-radius: 8px; border-left: 4px solid #667eea;">
            <h4 style="margin: 0 0 10px 0; color: #333; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Bill From</h4>
            <p style="margin: 5px 0; font-weight: bold; font-size: 14px;">${companyName}</p>
            <p style="margin: 5px 0; font-size: 12px; color: #666;">
              <strong>GSTIN:</strong> ${gstNumber}
            </p>
            <p style="margin: 5px 0; font-size: 12px; color: #666;">
              📞 ${companyPhone}
            </p>
            <p style="margin: 5px 0; font-size: 12px; color: #666;">
              📧 ${companyEmail}
            </p>
          </div>

          <!-- Customer/User Details -->
          <div style="flex: 1; padding: 15px; background: #f0f0f0; border-radius: 8px; border-left: 4px solid #764ba2;">
            <h4 style="margin: 0 0 10px 0; color: #333; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Bill To</h4>
            <p style="margin: 5px 0; font-weight: bold; font-size: 14px;">Customer - ${userInfo.name || 'User'}</p>
            <p style="margin: 5px 0; font-size: 12px; color: #666;">
              <strong>Type:</strong> ${userType.charAt(0).toUpperCase() + userType.slice(1)}
            </p>
            <p style="margin: 5px 0; font-size: 12px; color: #666;">
              📧 ${userInfo.email || 'N/A'}
            </p>
            <p style="margin: 5px 0; font-size: 12px; color: #666;">
              📞 ${userInfo.phone || 'N/A'}
            </p>
            <p style="margin: 5px 0; font-size: 12px; color: #666;">
              <strong>ID:</strong> ${transaction.customer_id || 'N/A'}
            </p>
          </div>
        </div>

        <!-- Transaction Details Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; background: white; border: 1px solid #ddd;">
          <thead>
            <tr style="background: #667eea; color: white;">
              <th style="padding: 12px; text-align: left; border: 1px solid #ddd; font-size: 13px; font-weight: bold;">Description</th>
              <th style="padding: 12px; text-align: center; border: 1px solid #ddd; font-size: 13px; font-weight: bold; width: 150px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 15px; border: 1px solid #ddd; font-size: 13px;">
                <strong>${typeLabels[transaction.type] || transaction.type}</strong><br/>
                <span style="color: #666; font-size: 11px;">Payment Method: ${paymentMethodLabels[transaction.payment_method] || transaction.payment_method}</span>
                ${transaction.booking_id ? `<br/><span style="color: #666; font-size: 11px;">Booking ID: ${transaction.booking_id}</span>` : ''}
                ${transaction.notes ? `<br/><span style="color: #666; font-size: 11px;">Notes: ${transaction.notes}</span>` : ''}
              </td>
              <td style="padding: 15px; border: 1px solid #ddd; text-align: right; font-size: 13px; font-weight: bold;">
                ${formatAmount(baseAmount)}
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Amount Breakdown -->
        <div style="margin-bottom: 30px; max-width: 400px; margin-left: auto;">
          <div style="display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #ddd; font-size: 13px;">
            <span>Subtotal:</span>
            <span style="font-weight: bold;">${formatAmount(baseAmount)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #ddd; color: #e67e22; font-size: 13px;">
            <span>GST (18%):</span>
            <span style="font-weight: bold;">+ ${formatAmount(gstAmount)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 15px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 16px; font-weight: bold; border-radius: 4px; margin-top: 10px;">
            <span>Total Amount Due:</span>
            <span>${formatAmount(totalAmount)}</span>
          </div>
        </div>

        <!-- Payment Status -->
        <div style="background: ${transaction.status === 'success' ? '#d4edda' : transaction.status === 'pending' ? '#fff3cd' : '#f8d7da'}; 
                    border: 2px solid ${transaction.status === 'success' ? '#28a745' : transaction.status === 'pending' ? '#ffc107' : '#dc3545'};
                    color: ${transaction.status === 'success' ? '#155724' : transaction.status === 'pending' ? '#856404' : '#721c24'};
                    padding: 15px; border-radius: 8px; margin-bottom: 30px; text-align: center;">
          <p style="margin: 0; font-weight: bold; font-size: 14px;">
            Status: <span style="text-transform: uppercase;">${transaction.status}</span>
          </p>
          ${transaction.status === 'success' ? `
            <p style="margin: 5px 0 0 0; font-size: 12px;">✓ Payment Received Successfully</p>
          ` : transaction.status === 'pending' ? `
            <p style="margin: 5px 0 0 0; font-size: 12px;">⏳ Payment Pending</p>
          ` : `
            <p style="margin: 5px 0 0 0; font-size: 12px;">✗ Payment Failed</p>
          `}
        </div>

        <!-- Transaction Info -->
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #dee2e6; margin-bottom: 20px; font-size: 12px; line-height: 1.8;">
          <h4 style="margin: 0 0 10px 0; color: #333;">Transaction Information</h4>
          <p style="margin: 5px 0;"><strong>Transaction ID:</strong> ${transaction.id}</p>
          <p style="margin: 5px 0;"><strong>Date & Time:</strong> ${formatDate(transaction.created_at)}</p>
          <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${paymentMethodLabels[transaction.payment_method] || transaction.payment_method}</p>
          ${transaction.gateway_order_id ? `<p style="margin: 5px 0;"><strong>Gateway Order ID:</strong> ${transaction.gateway_order_id}</p>` : ''}
          ${transaction.gateway_payment_id ? `<p style="margin: 5px 0;"><strong>Gateway Payment ID:</strong> ${transaction.gateway_payment_id}</p>` : ''}
        </div>

        <!-- GST Section -->
        <div style="background: #fffbf0; padding: 20px; border-radius: 8px; border-left: 4px solid #e67e22; margin-bottom: 20px; font-size: 12px; line-height: 1.8;">
          <h4 style="margin: 0 0 10px 0; color: #333;">💼 GST Details</h4>
          <p style="margin: 5px 0;"><strong>GSTIN:</strong> ${gstNumber}</p>
          <p style="margin: 5px 0;"><strong>Business Name:</strong> ${companyName}</p>
          <p style="margin: 5px 0;"><strong>GST Amount:</strong> ${formatAmount(gstAmount)}</p>
          <p style="margin: 5px 0; color: #666; font-size: 11px;">This invoice is generated for GST compliance and record keeping.</p>
        </div>

        <!-- Footer -->
        <div style="border-top: 2px solid #dee2e6; padding-top: 20px; text-align: center; font-size: 11px; color: #666; line-height: 1.6;">
          <p style="margin: 0;">Thank you for using ${companyName}!</p>
          <p style="margin: 5px 0 0 0;">This is a system-generated invoice. No signature required.</p>
          <p style="margin: 5px 0 0 0;">For support, contact us at ${companyEmail} or ${companyPhone}</p>
          <p style="margin: 10px 0 0 0; font-size: 10px; color: #999;">
            Generated on: ${new Date().toLocaleString('en-IN')} | Document ID: ${transaction.id.substring(0, 8).toUpperCase()}
          </p>
        </div>
      </div>
    `;
    
    container.innerHTML = invoiceHTML;
    document.body.appendChild(container);
    
    // Convert HTML to Canvas and then to PDF
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });
    
    // Remove container
    document.body.removeChild(container);
    
    // Create PDF
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    
    const pdf = new jsPDF('p', 'mm', 'A4');
    let position = 0;
    
    const imgData = canvas.toDataURL('image/png');
    
    // Add pages if content is longer than one page
    while (heightLeft >= 0) {
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      if (heightLeft > 0) {
        pdf.addPage();
        position = -pageHeight;
      }
    }
    
    // Generate filename
    const filename = `Invoice_${transaction.id.substring(0, 8)}_${new Date().getTime()}.pdf`;
    
    // Download PDF
    pdf.save(filename);
    
    return { success: true, filename };
  } catch (error) {
    console.error('Error generating PDF:', error);
    return { success: false, error: error.message };
  }
};

/**
 * View PDF Invoice (Open in new tab)
 */
export const viewTransactionPDF = async (transaction, userInfo, userType = 'customer') => {
  try {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '800px';
    container.style.backgroundColor = '#ffffff';
    container.style.padding = '40px';
    container.style.fontFamily = 'Arial, sans-serif';
    
    const gstNumber = "18AABCT1234H1Z0";
    const companyName = "CarWash+ Services";
    const companyPhone = "+91-1234567890";
    const companyEmail = "support@carwash.com";
    
    const formatAmount = (amount) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
      }).format(amount);
    };
    
    const formatDate = (dateStr) => {
      return new Date(dateStr).toLocaleString('en-IN', {
        dateStyle: 'long',
        timeStyle: 'medium',
      });
    };
    
    const typeLabels = {
      booking: 'Booking Payment',
      monthly_pass_purchase: 'Monthly Pass Purchase',
      wallet: 'Wallet Top-up',
      payment: 'General Payment',
      pass: 'Pass Purchase',
    };
    
    const paymentMethodLabels = {
      upi: 'UPI',
      card: 'Credit/Debit Card',
      wallet: 'Wallet',
      netbanking: 'Net Banking',
      other: 'Other',
    };
    
    const baseAmount = transaction.amount || 0;
    const gstAmount = transaction.gst || 0;
    const totalAmount = transaction.total_amount || transaction.amount || 0;
    
    const invoiceHTML = `
      <div style="background: #f8f9fa; padding: 0;">
        <!-- Header with Company Info -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; margin: -40px -40px 30px -40px; border-bottom: 3px solid #764ba2;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <h1 style="margin: 0; font-size: 32px; font-weight: bold;">${companyName}</h1>
              <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">INVOICE</p>
            </div>
            <div style="text-align: right; font-size: 12px; line-height: 1.6;">
              <p style="margin: 0;"><strong>Invoice #:</strong> ${transaction.id.substring(0, 12).toUpperCase()}</p>
              <p style="margin: 5px 0 0 0;"><strong>Date:</strong> ${formatDate(transaction.created_at).split(',')[0]}</p>
              <p style="margin: 5px 0 0 0;"><strong>Time:</strong> ${formatDate(transaction.created_at).split(',')[1]}</p>
            </div>
          </div>
        </div>

        <!-- Company and Customer Details -->
        <div style="display: flex; justify-content: space-between; margin-bottom: 30px; gap: 40px;">
          <!-- Company Details -->
          <div style="flex: 1; padding: 15px; background: #f0f0f0; border-radius: 8px; border-left: 4px solid #667eea;">
            <h4 style="margin: 0 0 10px 0; color: #333; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Bill From</h4>
            <p style="margin: 5px 0; font-weight: bold; font-size: 14px;">${companyName}</p>
            <p style="margin: 5px 0; font-size: 12px; color: #666;">
              <strong>GSTIN:</strong> ${gstNumber}
            </p>
            <p style="margin: 5px 0; font-size: 12px; color: #666;">
              📞 ${companyPhone}
            </p>
            <p style="margin: 5px 0; font-size: 12px; color: #666;">
              📧 ${companyEmail}
            </p>
          </div>

          <!-- Customer/User Details -->
          <div style="flex: 1; padding: 15px; background: #f0f0f0; border-radius: 8px; border-left: 4px solid #764ba2;">
            <h4 style="margin: 0 0 10px 0; color: #333; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Bill To</h4>
            <p style="margin: 5px 0; font-weight: bold; font-size: 14px;">Customer - ${userInfo.name || 'User'}</p>
            <p style="margin: 5px 0; font-size: 12px; color: #666;">
              <strong>Type:</strong> ${userType.charAt(0).toUpperCase() + userType.slice(1)}
            </p>
            <p style="margin: 5px 0; font-size: 12px; color: #666;">
              📧 ${userInfo.email || 'N/A'}
            </p>
            <p style="margin: 5px 0; font-size: 12px; color: #666;">
              📞 ${userInfo.phone || 'N/A'}
            </p>
            <p style="margin: 5px 0; font-size: 12px; color: #666;">
              <strong>ID:</strong> ${transaction.customer_id || 'N/A'}
            </p>
          </div>
        </div>

        <!-- Transaction Details Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; background: white; border: 1px solid #ddd;">
          <thead>
            <tr style="background: #667eea; color: white;">
              <th style="padding: 12px; text-align: left; border: 1px solid #ddd; font-size: 13px; font-weight: bold;">Description</th>
              <th style="padding: 12px; text-align: center; border: 1px solid #ddd; font-size: 13px; font-weight: bold; width: 150px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 15px; border: 1px solid #ddd; font-size: 13px;">
                <strong>${typeLabels[transaction.type] || transaction.type}</strong><br/>
                <span style="color: #666; font-size: 11px;">Payment Method: ${paymentMethodLabels[transaction.payment_method] || transaction.payment_method}</span>
                ${transaction.booking_id ? `<br/><span style="color: #666; font-size: 11px;">Booking ID: ${transaction.booking_id}</span>` : ''}
                ${transaction.notes ? `<br/><span style="color: #666; font-size: 11px;">Notes: ${transaction.notes}</span>` : ''}
              </td>
              <td style="padding: 15px; border: 1px solid #ddd; text-align: right; font-size: 13px; font-weight: bold;">
                ${formatAmount(baseAmount)}
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Amount Breakdown -->
        <div style="margin-bottom: 30px; max-width: 400px; margin-left: auto;">
          <div style="display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #ddd; font-size: 13px;">
            <span>Subtotal:</span>
            <span style="font-weight: bold;">${formatAmount(baseAmount)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #ddd; color: #e67e22; font-size: 13px;">
            <span>GST (18%):</span>
            <span style="font-weight: bold;">+ ${formatAmount(gstAmount)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 15px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 16px; font-weight: bold; border-radius: 4px; margin-top: 10px;">
            <span>Total Amount Due:</span>
            <span>${formatAmount(totalAmount)}</span>
          </div>
        </div>

        <!-- Payment Status -->
        <div style="background: ${transaction.status === 'success' ? '#d4edda' : transaction.status === 'pending' ? '#fff3cd' : '#f8d7da'}; 
                    border: 2px solid ${transaction.status === 'success' ? '#28a745' : transaction.status === 'pending' ? '#ffc107' : '#dc3545'};
                    color: ${transaction.status === 'success' ? '#155724' : transaction.status === 'pending' ? '#856404' : '#721c24'};
                    padding: 15px; border-radius: 8px; margin-bottom: 30px; text-align: center;">
          <p style="margin: 0; font-weight: bold; font-size: 14px;">
            Status: <span style="text-transform: uppercase;">${transaction.status}</span>
          </p>
          ${transaction.status === 'success' ? `
            <p style="margin: 5px 0 0 0; font-size: 12px;">✓ Payment Received Successfully</p>
          ` : transaction.status === 'pending' ? `
            <p style="margin: 5px 0 0 0; font-size: 12px;">⏳ Payment Pending</p>
          ` : `
            <p style="margin: 5px 0 0 0; font-size: 12px;">✗ Payment Failed</p>
          `}
        </div>

        <!-- Transaction Info -->
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #dee2e6; margin-bottom: 20px; font-size: 12px; line-height: 1.8;">
          <h4 style="margin: 0 0 10px 0; color: #333;">Transaction Information</h4>
          <p style="margin: 5px 0;"><strong>Transaction ID:</strong> ${transaction.id}</p>
          <p style="margin: 5px 0;"><strong>Date & Time:</strong> ${formatDate(transaction.created_at)}</p>
          <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${paymentMethodLabels[transaction.payment_method] || transaction.payment_method}</p>
          ${transaction.gateway_order_id ? `<p style="margin: 5px 0;"><strong>Gateway Order ID:</strong> ${transaction.gateway_order_id}</p>` : ''}
          ${transaction.gateway_payment_id ? `<p style="margin: 5px 0;"><strong>Gateway Payment ID:</strong> ${transaction.gateway_payment_id}</p>` : ''}
        </div>

        <!-- GST Section -->
        <div style="background: #fffbf0; padding: 20px; border-radius: 8px; border-left: 4px solid #e67e22; margin-bottom: 20px; font-size: 12px; line-height: 1.8;">
          <h4 style="margin: 0 0 10px 0; color: #333;">💼 GST Details</h4>
          <p style="margin: 5px 0;"><strong>GSTIN:</strong> ${gstNumber}</p>
          <p style="margin: 5px 0;"><strong>Business Name:</strong> ${companyName}</p>
          <p style="margin: 5px 0;"><strong>GST Amount:</strong> ${formatAmount(gstAmount)}</p>
          <p style="margin: 5px 0; color: #666; font-size: 11px;">This invoice is generated for GST compliance and record keeping.</p>
        </div>

        <!-- Footer -->
        <div style="border-top: 2px solid #dee2e6; padding-top: 20px; text-align: center; font-size: 11px; color: #666; line-height: 1.6;">
          <p style="margin: 0;">Thank you for using ${companyName}!</p>
          <p style="margin: 5px 0 0 0;">This is a system-generated invoice. No signature required.</p>
          <p style="margin: 5px 0 0 0;">For support, contact us at ${companyEmail} or ${companyPhone}</p>
          <p style="margin: 10px 0 0 0; font-size: 10px; color: #999;">
            Generated on: ${new Date().toLocaleString('en-IN')} | Document ID: ${transaction.id.substring(0, 8).toUpperCase()}
          </p>
        </div>
      </div>
    `;
    
    container.innerHTML = invoiceHTML;
    document.body.appendChild(container);
    
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });
    
    document.body.removeChild(container);
    
    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    
    const pdf = new jsPDF('p', 'mm', 'A4');
    let position = 0;
    
    const imgData = canvas.toDataURL('image/png');
    
    while (heightLeft >= 0) {
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      if (heightLeft > 0) {
        pdf.addPage();
        position = -pageHeight;
      }
    }
    
    // Open in new tab
    const pdfBlob = pdf.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
    
    return { success: true };
  } catch (error) {
    console.error('Error viewing PDF:', error);
    return { success: false, error: error.message };
  }
};
