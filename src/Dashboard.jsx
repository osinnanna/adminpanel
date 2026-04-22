import React, { useState, useEffect } from "react";
import AddProduct from "./AddProduct";

export default function Dashboard({ token, onLogout }) {
  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    brand: "",
    price: 0,
    stockQuantity: 0,
  });

  const fetchInventory = async () => {
    try {
      const response = await fetch("/api/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // --- BUG FIX: Safely extract the ID regardless of what Spring Boot calls it ---
  const getId = (product) => product.id || product.productId;

  // --- EDITING LOGIC ---
  const handleEditClick = (product) => {
    const currentId = getId(product);
    setEditingId(currentId);
    setEditFormData({
      name: product.name,
      brand: product.brand,
      price: product.price,
      stockQuantity: product.stockQuantity,
    });
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]:
        name === "price" || name === "stockQuantity" ? Number(value) : value,
    });
  };

  const handleCancelClick = () => {
    setEditingId(null);
  };

  const handleSaveClick = async (product) => {
    const currentId = getId(product);
    try {
      const response = await fetch(`/api/products/${currentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editFormData),
      });

      if (response.ok) {
        const updatedProducts = products.map((p) =>
          getId(p) === currentId ? { ...p, ...editFormData } : p,
        );
        setProducts(updatedProducts);
        setEditingId(null);
      } else {
        // Detailed error to help you debug the backend
        alert(
          `Failed to save! Server returned ${response.status}. Ensure a PUT endpoint for /api/products/{id} exists in your Spring Boot Controller.`,
        );
      }
    } catch (err) {
      console.error("Network error while updating:", err);
      alert("Network error while trying to save.");
    }
  };

  // --- DELETE LOGIC ---
  const handleDeleteClick = async (product) => {
    const currentId = getId(product);

    // Prevent accidental clicks
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${product.name}"?`,
    );
    if (!confirmDelete) return;

    try {
      const response = await fetch(`/api/products/${currentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Remove the item from the UI immediately without needing to reload the page
        setProducts(products.filter((p) => getId(p) !== currentId));
      } else {
        alert(
          `Failed to delete! Server returned ${response.status}. Ensure a DELETE endpoint for /api/products/{id} exists in your Spring Boot Controller.`,
        );
      }
    } catch (err) {
      console.error("Network error while deleting:", err);
      alert("Network error while trying to delete.");
    }
  };

  return (
    <div>
      <header>
        <h1>Admin Inventory Dashboard</h1>
        <button onClick={onLogout}>Logout</button>
      </header>

      <AddProduct token={token} onProductAdded={fetchInventory} />

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Brand</th>
            <th>Price ($)</th>
            <th>Stock</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const currentId = getId(product);

            return (
              <tr key={currentId}>
                <td>{currentId}</td>
                {editingId === currentId ? (
                  // --- EDIT MODE UI ---
                  <>
                    <td>
                      <input
                        className="edit-input"
                        type="text"
                        name="name"
                        value={editFormData.name}
                        onChange={handleEditFormChange}
                      />
                    </td>
                    <td>
                      <input
                        className="edit-input"
                        type="text"
                        name="brand"
                        value={editFormData.brand}
                        onChange={handleEditFormChange}
                      />
                    </td>
                    <td>
                      <input
                        className="edit-input"
                        type="number"
                        step="0.01"
                        name="price"
                        value={editFormData.price}
                        onChange={handleEditFormChange}
                      />
                    </td>
                    <td>
                      <input
                        className="edit-input"
                        type="number"
                        name="stockQuantity"
                        value={editFormData.stockQuantity}
                        onChange={handleEditFormChange}
                      />
                    </td>
                    <td className="actions-cell">
                      <button onClick={() => handleSaveClick(product)}>
                        Save
                      </button>
                      <button className="secondary" onClick={handleCancelClick}>
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  // --- VIEW MODE UI ---
                  <>
                    <td>{product.name}</td>
                    <td>{product.brand}</td>
                    <td>{product.price.toFixed(2)}</td>
                    <td>{product.stockQuantity}</td>
                    <td className="actions-cell">
                      <button
                        className="secondary"
                        onClick={() => handleEditClick(product)}
                      >
                        Edit
                      </button>
                      <button
                        className="secondary"
                        style={{ color: "#dc2626", borderColor: "#fca5a5" }}
                        onClick={() => handleDeleteClick(product)}
                      >
                        Delete
                      </button>
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
