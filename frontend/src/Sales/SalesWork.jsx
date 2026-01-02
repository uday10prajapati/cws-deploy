import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";
import NavbarNew from "../components/NavbarNew";
import {
  FiMapPin,
  FiUsers,
  FiSearch,
  FiX,
  FiCheck,
  FiPhone,
  FiMail,
  FiCamera,
  FiFileText,
  FiCheckCircle,
  FiAlertCircle,
  FiDollarSign,
} from "react-icons/fi";

const SalesWork = () => {
  useRoleBasedRedirect("sales");
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [assignedArea, setAssignedArea] = useState(null);
  const [areaCustomers, setAreaCustomers] = useState([]);
  const [potentialCustomers, setPotentialCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showCarModal, setShowCarModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [carsList, setCarsList] = useState([]);

  const [customerForm, setCustomerForm] = useState({
    name: "",
    phone: "",
    email: "",
    carModel: "",
    carNumber: "",
    carColor: "",
    carImage: null,
    lightBill: null,
    identityProof: null,
  });

  const [carForm, setCarForm] = useState({
    customerName: "",
    customerPhone: "",
    model: "",
    numberPlate: "",
    color: "",
    carPhoto: null,
    addressProof: null,
    lightBill: null,
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        navigate("/login");
        return;
      }

      setUser(authUser);

      // Fetch assigned talukas from user_role_assignments table
      const { data: assignedAreaData, error: areaError } = await supabase
        .from("user_role_assignments")
        .select("assigned_talukas")
        .eq("user_id", authUser.id)
        .eq("role", "salesman")
        .single();

      if (areaError && areaError.code !== "PGRST116") {
        console.error("Error fetching assigned area:", areaError);
      }

      if (assignedAreaData && assignedAreaData.assigned_talukas && assignedAreaData.assigned_talukas.length > 0) {
        // Get the first taluka from the array
        const selectedArea = assignedAreaData.assigned_talukas[0];
        setAssignedArea(selectedArea);
        await loadAreaCustomers(selectedArea, authUser.id);
      } else {
        console.warn("No assigned area found for this sales person");
        setAssignedArea(null);
      }

      await loadCars(authUser.id);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCars = async (salesPersonId) => {
    try {
      const { data: cars } = await supabase
        .from("sales_cars")
        .select("*")
        .eq("sales_person_id", salesPersonId)
        .order("created_at", { ascending: false });

      if (cars) {
        setCarsList(cars);
      }
    } catch (error) {
      console.error("Error loading cars:", error);
    }
  };

  const loadAreaCustomers = async (area, salesPersonId) => {
    try {
      // Get cars already added by this sales person
      const { data: addedCustomers } = await supabase
        .from("sales_cars")
        .select("*")
        .eq("sales_person_id", salesPersonId)
        .order("created_at", { ascending: false });

      if (addedCustomers) {
        setAreaCustomers(addedCustomers);
      }

      // Get potential customers from profiles table (all customers not yet added)
      const { data: potential } = await supabase
        .from("profiles")
        .select("*")
        .eq("area", area)
        .eq("role", "customer")
        .order("created_at", { ascending: false });

      if (potential) {
        setPotentialCustomers(potential);
      }
    } catch (error) {
      console.error("Error loading customers:", error);
    }
  };

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setCustomerForm({
      name: customer.name || "",
      phone: customer.phone || "",
      email: customer.email || "",
      carModel: "",
      carNumber: "",
      carColor: "",
      carImage: null,
      lightBill: customer.light_bill_url ? { name: "Existing" } : null,
      identityProof: customer.identity_proof_url ? { name: "Existing" } : null,
    });
    setShowCustomerModal(true);
  };

  const handleFileChange = (e, fieldName) => {
    setCustomerForm({
      ...customerForm,
      [fieldName]: e.target.files[0],
    });
  };

  const handleCompleteCustomer = async () => {
    if (!customerForm.carModel || !customerForm.carNumber) {
      alert("Please fill in car details");
      return;
    }

    if (!customerForm.carImage) {
      alert("Please upload car image");
      return;
    }

    if (!customerForm.lightBill || !customerForm.identityProof) {
      alert("Please upload both documents");
      return;
    }

    setUploading(true);
    try {
      const customerId = selectedCustomer?.id || user?.id;
      const timestamp = new Date().getTime();

      // Upload car image
      let carImageUrl = selectedCustomer?.car_image_url;
      if (customerForm.carImage instanceof File) {
        const { data: imgData, error: imgError } = await supabase.storage
          .from("sales_customers")
          .upload(
            `${customerId}/${timestamp}_car_${customerForm.carImage.name}`,
            customerForm.carImage
          );

        if (imgError) throw imgError;
        carImageUrl = supabase.storage
          .from("sales_customers")
          .getPublicUrl(imgData.path).data.publicUrl;
      }

      // Upload light bill
      let lightBillUrl = selectedCustomer?.light_bill_url;
      if (customerForm.lightBill instanceof File) {
        const { data: billData, error: billError } = await supabase.storage
          .from("sales_customers")
          .upload(
            `${customerId}/${timestamp}_lightbill_${customerForm.lightBill.name}`,
            customerForm.lightBill
          );

        if (billError) throw billError;
        lightBillUrl = supabase.storage
          .from("sales_customers")
          .getPublicUrl(billData.path).data.publicUrl;
      }

      // Upload identity proof
      let identityProofUrl = selectedCustomer?.identity_proof_url;
      if (customerForm.identityProof instanceof File) {
        const { data: idData, error: idError } = await supabase.storage
          .from("sales_customers")
          .upload(
            `${customerId}/${timestamp}_identity_${customerForm.identityProof.name}`,
            customerForm.identityProof
          );

        if (idError) throw idError;
        identityProofUrl = supabase.storage
          .from("sales_customers")
          .getPublicUrl(idData.path).data.publicUrl;
      }

      // Create or update car record in sales_cars table
      if (selectedCustomer?.id) {
        // Update existing customer record in sales_cars if it exists
        const existingCar = areaCustomers.find(c => c.customer_phone === customerForm.phone);
        if (existingCar) {
          const { error } = await supabase
            .from("sales_cars")
            .update({
              model: customerForm.carModel,
              number_plate: customerForm.carNumber,
              color: customerForm.carColor,
              car_photo_url: carImageUrl,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingCar.id);

          if (error) throw error;
        }
      } else {
        // Create new car record in sales_cars
        const { error } = await supabase.from("sales_cars").insert([
          {
            id: `car_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            sales_person_id: user.id,
            model: customerForm.carModel,
            number_plate: customerForm.carNumber,
            color: customerForm.carColor,
            car_photo_url: carImageUrl,
            customer_name: customerForm.name,
            customer_phone: customerForm.phone,
          },
        ]);

        if (error) throw error;
      }

      alert("✅ Customer registered successfully!");
      setShowCustomerModal(false);
      await loadAreaCustomers(assignedArea, user.id);
    } catch (error) {
      console.error("Error saving customer:", error);
      alert("Failed to register customer");
    } finally {
      setUploading(false);
    }
  }

  const handleAddCar = async () => {
    if (!carForm.customerName || !carForm.customerPhone) {
      alert("Please fill in customer details (name and phone)");
      return;
    }

    if (!carForm.model || !carForm.numberPlate || !carForm.color) {
      alert("Please fill in all car details");
      return;
    }

    if (!carForm.carPhoto) {
      alert("Please upload car photo");
      return;
    }

    if (!carForm.addressProof || !carForm.lightBill) {
      alert("Please upload all required documents (Address Proof, Light Bill)");
      return;
    }

    setUploading(true);
    try {
      const timestamp = new Date().getTime();
      const carId = `car_${user.id}_${timestamp}`;

      // Upload car photo
      const carPhotoPath = `cars/${user.id}/${timestamp}_car_photo_${carForm.carPhoto.name}`;
      const { data: carPhotoData, error: carPhotoError } = await supabase.storage
        .from("sales_customers")
        .upload(carPhotoPath, carForm.carPhoto, { upsert: true });

      if (carPhotoError) {
        console.error("Car photo upload error:", carPhotoError);
        throw new Error(`Failed to upload Car Photo: ${carPhotoError.message}`);
      }

      const carPhotoUrl = supabase.storage
        .from("sales_customers")
        .getPublicUrl(carPhotoPath).data.publicUrl;

      // Upload address proof document
      const addressProofPath = `documents/${user.id}/${timestamp}_address_proof_${carForm.addressProof.name}`;
      const { data: addressData, error: addressError } = await supabase.storage
        .from("sales_customers")
        .upload(addressProofPath, carForm.addressProof, { upsert: true });

      if (addressError) {
        console.error("Address proof upload error:", addressError);
        throw new Error(`Failed to upload Address Proof: ${addressError.message}`);
      }

      const addressProofUrl = supabase.storage
        .from("sales_customers")
        .getPublicUrl(addressProofPath).data.publicUrl;

      // Upload light bill document
      const lightBillPath = `documents/${user.id}/${timestamp}_light_bill_${carForm.lightBill.name}`;
      const { data: lightBillData, error: lightBillError } = await supabase.storage
        .from("sales_customers")
        .upload(lightBillPath, carForm.lightBill, { upsert: true });

      if (lightBillError) {
        console.error("Light bill upload error:", lightBillError);
        throw new Error(`Failed to upload Light Bill: ${lightBillError.message}`);
      }

      const lightBillUrl = supabase.storage
        .from("sales_customers")
        .getPublicUrl(lightBillPath).data.publicUrl;

      console.log("All URLs:", { carPhotoUrl, addressProofUrl, lightBillUrl });

      // Insert car record with customer details and document URLs
      const { data: insertData, error: insertError } = await supabase.from("sales_cars").insert([
        {
          id: carId,
          sales_person_id: user.id,
          customer_name: carForm.customerName,
          customer_phone: carForm.customerPhone,
          model: carForm.model,
          number_plate: carForm.numberPlate,
          color: carForm.color,
          car_photo_url: carPhotoUrl,
          image_url_1: addressProofUrl,
          image_url_2: lightBillUrl,
          created_at: new Date().toISOString(),
        },
      ]);

      if (insertError) {
        console.error("Database insert error:", insertError);
        throw new Error(`Failed to save car data: ${insertError.message}`);
      }

      alert("✅ Car and documents added successfully!");
      setCarForm({ customerName: "", customerPhone: "", model: "", numberPlate: "", color: "", carPhoto: null, addressProof: null, lightBill: null });
      setShowCarModal(false);
      await loadCars(user.id);
    } catch (error) {
      console.error("Error adding car:", error);
      alert(`Failed to add car: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteCar = async (carId) => {
    if (window.confirm("Are you sure you want to delete this car?")) {
      try {
        const { error } = await supabase
          .from("sales_cars")
          .delete()
          .eq("id", carId);

        if (error) throw error;

        alert("✅ Car deleted successfully!");
        await loadCars(user.id);
      } catch (error) {
        console.error("Error deleting car:", error);
        alert("Failed to delete car");
      }
    }
  };
  if (loading) {
    return (
      <div className="pt-20 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 pt-20">
      <NavbarNew />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Sales Work</h1>
          <p className="text-slate-600">
            Manage your assigned area and register new customers
          </p>
        </div>

        {/* Area Assignment Card */}
        {assignedArea && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8 border-l-4 border-blue-600">
            <div className="flex items-center gap-3">
              <FiMapPin className="text-blue-600" size={24} />
              <div>
                <p className="text-sm text-slate-600">Your Assigned Area</p>
                <p className="text-2xl font-bold text-slate-900">
                  {assignedArea}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-2">Customers Registered</p>
                <p className="text-3xl font-bold text-slate-900">
                  {areaCustomers.length}
                </p>
              </div>
              <FiUsers className="text-green-500" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-2">Potential Customers</p>
                <p className="text-3xl font-bold text-slate-900">
                  {potentialCustomers.length}
                </p>
              </div>
              <FiSearch className="text-purple-500" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-2">Pending Approval</p>
                <p className="text-3xl font-bold text-slate-900">
                  {areaCustomers.filter((c) => c.approval_status === "pending")
                    .length}
                </p>
              </div>
              <FiAlertCircle className="text-orange-500" size={32} />
            </div>
          </div>
        </div>


        {/* Cars Management Section */}
        <div className="bg-white rounded-lg shadow-md mb-4 p-6 mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FiCamera className="text-blue-500" />
              Registered Cars
            </h2>
            <button
              onClick={() => setShowCarModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              + Add Car
            </button>
          </div>

          {carsList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">
                      Customer Name
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">
                      Phone
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">
                      Car Model
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">
                      Number Plate
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">
                      Color
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">
                      Images
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">
                      Date Added
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {carsList.map((car) => (
                    <tr
                      key={car.id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900">
                          {car.customer_name || "N/A"}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-slate-600">
                          {car.customer_phone || "N/A"}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900">
                          {car.model}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-slate-600 font-mono">
                          {car.number_plate}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                          {car.color}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          {car.image_url_1 && (
                            <a
                              href={car.image_url_1}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm"
                            >
                              📷 Img1
                            </a>
                          )}
                          {car.image_url_2 && (
                            <a
                              href={car.image_url_2}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm"
                            >
                              📷 Img2
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-slate-600">
                          {new Date(car.created_at).toLocaleDateString("en-IN")}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleDeleteCar(car.id)}
                          className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition text-sm font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <FiCamera className="mx-auto text-slate-400 mb-2" size={40} />
              <p className="text-slate-600">No cars registered yet</p>
            </div>
          )}
        </div>

        {/* Registered Customers Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-slate-900 mt-4 mb-4 flex items-center gap-2">
            <FiCheckCircle className="text-green-500" />
            Your Registered Customers
          </h2>

          {areaCustomers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">
                      Name
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">
                      Contact
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">
                      Car Model
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">
                      Number Plate
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">
                      Date Added
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {areaCustomers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900">
                          {customer.customer_name || "N/A"}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-slate-600">
                          {customer.customer_phone || "N/A"}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-slate-600">
                          {customer.model || "N/A"}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-slate-600 font-mono">
                          {customer.number_plate || "N/A"}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-slate-600">
                          {customer.created_at ? new Date(customer.created_at).toLocaleDateString("en-IN") : "N/A"}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <FiUsers className="mx-auto text-slate-400 mb-2" size={40} />
              <p className="text-slate-600">No customers registered yet</p>
            </div>
          )}
        </div>

        

        {/* Customer Details Table */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <FiUsers className="text-green-500" />
            All Customer Details
          </h2>

          {carsList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-slate-200 bg-slate-50">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">
                      Customer Name
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">
                      Phone
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">
                      Car Model
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">
                      Number Plate
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">
                      Color
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">
                      Images
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">
                      Date Added
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {carsList.map((car) => (
                    <tr
                      key={car.id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900">
                          {car.customer_name || "N/A"}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-slate-600">
                          {car.customer_phone || "N/A"}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900">
                          {car.model || "N/A"}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-slate-600 font-mono">
                          {car.number_plate || "N/A"}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">
                          {car.color || "N/A"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          {car.image_url_1 && (
                            <a
                              href={car.image_url_1}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-xs font-semibold"
                            >
                              📷 Img1
                            </a>
                          )}
                          {car.image_url_2 && (
                            <a
                              href={car.image_url_2}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-xs font-semibold"
                            >
                              📷 Img2
                            </a>
                          )}
                          {!car.image_url_1 && !car.image_url_2 && (
                            <span className="text-slate-500 text-xs">No images</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-slate-600 text-xs">
                          {car.created_at ? new Date(car.created_at).toLocaleDateString("en-IN") : "N/A"}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <FiUsers className="mx-auto text-slate-400 mb-2" size={40} />
              <p className="text-slate-600">No customer details available</p>
            </div>
          )}
        </div>
      </div>

      {/* Car Registration Modal */}
      {showCarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900">
                Add New Car
              </h2>
              <button
                onClick={() => {
                  setShowCarModal(false);
                  setCarForm({ customerName: "", customerPhone: "", model: "", numberPlate: "", color: "", carPhoto: null, addressProof: null, lightBill: null });
                }}
                className="text-slate-500 hover:text-slate-700"
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Customer Details Section */}
              <div className="mb-6 pb-6 border-b-2 border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <FiUsers className="text-blue-600" />
                  Customer Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Customer Name"
                    value={carForm.customerName}
                    onChange={(e) =>
                      setCarForm({ ...carForm, customerName: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="tel"
                    placeholder="Customer Phone Number"
                    value={carForm.customerPhone}
                    onChange={(e) =>
                      setCarForm({ ...carForm, customerPhone: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
            </div>

            {/* Car Details Section */}
            <div className="mb-6 pb-6 border-b-2 border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <FiCamera className="text-blue-600" />
                Car Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Car Model (e.g., Honda Civic)"
                  value={carForm.model}
                  onChange={(e) =>
                    setCarForm({ ...carForm, model: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Number Plate (e.g., MH-01-AB-1234)"
                  value={carForm.numberPlate}
                  onChange={(e) =>
                    setCarForm({ ...carForm, numberPlate: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Car Color (e.g., White, Black)"
                  value={carForm.color}
                  onChange={(e) =>
                    setCarForm({ ...carForm, color: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Car Image Section */}
            <div className="mb-6 pb-6 border-b-2 border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <FiCamera className="text-blue-600" />
                Car Photo
              </h3>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Upload Car Photo
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setCarForm({ ...carForm, carPhoto: e.target.files[0] })
                      }
                      className="hidden"
                      id="car-photo-input"
                    />
                    <label
                      htmlFor="car-photo-input"
                      className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition"
                    >
                      <div className="text-center">
                        <FiCamera className="mx-auto text-slate-400 mb-2" size={32} />
                        <p className="text-sm text-slate-600 font-medium">
                          Click to upload Car Photo
                        </p>
                        <p className="text-xs text-slate-500">PNG, JPG up to 10MB</p>
                      </div>
                    </label>
                  </div>
                  {carForm.carPhoto && (
                    <div className="text-right">
                      <p className="text-sm text-green-600 font-semibold mb-2">✓ Uploaded</p>
                      <p className="text-xs text-slate-600 truncate w-20">
                        {carForm.carPhoto.name}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Documents Section */}
            <div className="border-t border-slate-200 bg-slate-50 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <FiFileText className="text-green-600" />
                Customer Documents
              </h3>

              <div className="space-y-4">
                {/* Address Proof */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Address Proof (ID/Aadhaar/Voter ID)
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setCarForm({ ...carForm, addressProof: e.target.files[0] })
                        }
                        className="hidden"
                        id="address-proof-input"
                      />
                      <label
                        htmlFor="address-proof-input"
                        className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-green-300 rounded-lg cursor-pointer hover:border-green-500 hover:bg-green-50 transition"
                      >
                        <div className="text-center">
                          <FiFileText className="mx-auto text-green-400 mb-2" size={32} />
                          <p className="text-sm text-slate-600 font-medium">
                            Click to upload Address Proof
                          </p>
                          <p className="text-xs text-slate-500">PNG, JPG up to 10MB</p>
                        </div>
                      </label>
                    </div>
                    {carForm.addressProof && (
                      <div className="text-right">
                        <p className="text-sm text-green-600 font-semibold mb-2">✓ Uploaded</p>
                        <p className="text-xs text-slate-600 truncate w-20">
                          {carForm.addressProof.name}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Light Bill */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Light Bill / Electricity Bill
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setCarForm({ ...carForm, lightBill: e.target.files[0] })
                        }
                        className="hidden"
                        id="light-bill-input"
                      />
                      <label
                        htmlFor="light-bill-input"
                        className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-green-300 rounded-lg cursor-pointer hover:border-green-500 hover:bg-green-50 transition"
                      >
                        <div className="text-center">
                          <FiFileText className="mx-auto text-green-400 mb-2" size={32} />
                          <p className="text-sm text-slate-600 font-medium">
                            Click to upload Light Bill
                          </p>
                          <p className="text-xs text-slate-500">PNG, JPG up to 10MB</p>
                        </div>
                      </label>
                    </div>
                    {carForm.lightBill && (
                      <div className="text-right">
                        <p className="text-sm text-green-600 font-semibold mb-2">✓ Uploaded</p>
                        <p className="text-xs text-slate-600 truncate w-20">
                          {carForm.lightBill.name}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 p-6 border-t border-slate-200">
              <button
                onClick={() => {
                  setShowCarModal(false);
                  setCarForm({ customerName: "", customerPhone: "", model: "", numberPlate: "", color: "", carPhoto: null, addressProof: null, lightBill: null });
                }}
                disabled={uploading}
                className="flex-1 px-4 py-2 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCar}
                disabled={uploading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50"
              >
                {uploading ? "Adding..." : "Add Car"}
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Registration Modal - Keep existing */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">
                Register Customer
              </h2>
              <button
                onClick={() => setShowCustomerModal(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Customer Info Section */}
            <div className="mb-6 pb-6 border-b-2 border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Customer Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={customerForm.name}
                  onChange={(e) =>
                    setCustomerForm({ ...customerForm, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={customerForm.phone}
                  onChange={(e) =>
                    setCustomerForm({ ...customerForm, phone: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={customerForm.email}
                  onChange={(e) =>
                    setCustomerForm({ ...customerForm, email: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Car Info Section */}
            <div className="mb-6 pb-6 border-b-2 border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <FiCamera className="text-blue-600" />
                Car Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Car Model"
                  value={customerForm.carModel}
                  onChange={(e) =>
                    setCustomerForm({
                      ...customerForm,
                      carModel: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Car Number Plate"
                  value={customerForm.carNumber}
                  onChange={(e) =>
                    setCustomerForm({
                      ...customerForm,
                      carNumber: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Car Color"
                  value={customerForm.carColor}
                  onChange={(e) =>
                    setCustomerForm({
                      ...customerForm,
                      carColor: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Car Image Upload */}
              <div className="mt-4">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Car Photo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "carImage")}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                />
                {customerForm.carImage && (
                  <p className="text-sm text-green-600 mt-2">
                    ✓ {customerForm.carImage.name}
                  </p>
                )}
              </div>
            </div>

            {/* Documents Section */}
            <div className="mb-6 pb-6 border-b-2 border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <FiFileText className="text-blue-600" />
                Required Documents
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Light Bill / Utility Bill
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(e, "lightBill")}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  />
                  {customerForm.lightBill && (
                    <p className="text-sm text-green-600 mt-2">
                      ✓{" "}
                      {customerForm.lightBill.name ||
                        "Document already uploaded"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Identity Proof (Aadhar/Passport/DL)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(e, "identityProof")}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  />
                  {customerForm.identityProof && (
                    <p className="text-sm text-green-600 mt-2">
                      ✓{" "}
                      {customerForm.identityProof.name ||
                        "Document already uploaded"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowCustomerModal(false)}
                disabled={uploading}
                className="flex-1 px-4 py-2 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteCustomer}
                disabled={uploading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50"
              >
                {uploading ? "Registering..." : "Register Customer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesWork;
