import React, { useState } from "react";

export default function AddProduct({ token, onProductAdded }) {
  // State for the text/number inputs
  const [formData, setFormData] = useState({
    name: "",
    category: "", // Required by your API specs
    brand: "",
    price: "",
    stockQuantity: "",
  });

  // Separate state for the file upload
  const [imageFile, setImageFile] = useState(null);

  // State for UI feedback
  const [status, setStatus] = useState("");

  // Handle normal text/number inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle the file input separately
  const handleFileChange = (e) => {
    setImageFile(e.target.files[0]); // Grab the first file selected
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Adding product...");

    // 1. Build the exact JSON structure your Spring Boot backend expects
    const productPayload = {
      name: formData.name,
      category: formData.category,
      brand: formData.brand,
      price: parseFloat(formData.price), // Ensure it's a number
      stockQuantity: parseInt(formData.stockQuantity, 10), // Ensure it's an integer
    };

    // 2. Initialize FormData
    // 2. Initialize FormData
    const submissionData = new FormData();

    // Create a Blob to force the Content-Type of this specific part to be application/json
    const jsonBlob = new Blob([JSON.stringify(productPayload)], {
      type: "application/json",
    });

    submissionData.append("product", jsonBlob);

    // Append the file ONLY if the user selected one (since it's unrequired)
    if (imageFile) {
      submissionData.append("image", imageFile);
    }

    try {
      const response = await fetch("/api/products/add", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // ⚠️ DO NOT set 'Content-Type' here. The browser handles it for FormData.
        },
        body: submissionData,
      });

      if (response.ok) {
        setStatus("✅ Product added successfully!");

        // Clear the form
        setFormData({
          name: "",
          category: "",
          brand: "",
          price: "",
          stockQuantity: "",
        });
        setImageFile(null);
        e.target.reset(); // Clears the actual <input type="file"> UI

        // Tell the Dashboard to re-fetch the inventory so the new item appears
        if (onProductAdded) {
          onProductAdded();
        }
      } else {
        setStatus("❌ Failed to add product. Check permissions.");
      }
    } catch (err) {
      console.error(err);
      setStatus("❌ Network error.");
    }
  };

  return (
    <div
      style={{
        background: "#fff",
        padding: "1.5rem",
        border: "1px solid #e4e4e7",
        borderRadius: "6px",
        marginBottom: "2rem",
      }}
    >
      <h3 style={{ marginBottom: "1rem", fontSize: "1.25rem" }}>
        Add New Product
      </h3>

      <form
        onSubmit={handleSubmit}
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}
      >
        <input
          type="text"
          name="name"
          placeholder="Product Name"
          required
          value={formData.name}
          onChange={handleChange}
        />

        <input
          type="text"
          name="category"
          placeholder="Category (e.g., Travel)"
          required
          value={formData.category}
          onChange={handleChange}
        />

        <input
          type="text"
          name="brand"
          placeholder="Brand"
          required
          value={formData.brand}
          onChange={handleChange}
        />

        <input
          type="number"
          step="0.01"
          name="price"
          placeholder="Price ($)"
          required
          value={formData.price}
          onChange={handleChange}
        />

        <input
          type="number"
          name="stockQuantity"
          placeholder="Initial Stock"
          required
          value={formData.stockQuantity}
          onChange={handleChange}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <label
            style={{
              fontSize: "0.8rem",
              color: "#52525b",
              marginBottom: "0.25rem",
            }}
          >
            Product Image (Optional)
          </label>
          <input type="file" accept="image/*" onChange={handleFileChange} />
        </div>

        <div
          style={{
            gridColumn: "1 / -1",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <button type="submit">Upload Product</button>
          <span
            style={{
              fontSize: "0.875rem",
              color: status.includes("❌") ? "red" : "green",
            }}
          >
            {status}
          </span>
        </div>
      </form>
    </div>
  );
}
