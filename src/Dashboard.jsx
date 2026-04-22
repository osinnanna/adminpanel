import React, { useState, useEffect } from "react";
import AddProduct from "./AddProduct";

export default function Dashboard({ token, onLogout }) {
  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // State includes 'category' to prevent 400 Bad Request from Spring Boot @Valid
  const [editFormData, setEditFormData] = useState({
    name: "",
    category: "",
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

  // Safely extract the ID regardless of what Spring Boot calls it
  const getId = (product) => product.id || product.productId;

  // --- EDITING LOGIC ---
  const handleEditClick = (product) => {
    const currentId = getId(product);
    setEditingId(currentId);
    setEditFormData({
      name: product.name,
      category: product.category || "", // Fallback to empty string if undefined
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

  // --- REAL BACKEND SAVE LOGIC ---
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
        // Update the React state only AFTER the database confirms the save
        const updatedProducts = products.map((p) =>
          getId(p) === currentId ? { ...p, ...editFormData } : p,
        );
        setProducts(updatedProducts);
        setEditingId(null);
      } else {
        alert(`Failed to save! Server returned ${response.status}.`);
      }
    } catch (err) {
      console.error("Network error while updating:", err);
      alert("Network error while trying to save.");
    }
  };

  // --- REAL BACKEND DELETE LOGIC ---
  const handleDeleteClick = async (product) => {
    const currentId = getId(product);

    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete "${product.name}" from the database?`,
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
        // Remove from React state only AFTER the database confirms the deletion
        setProducts(products.filter((p) => getId(p) !== currentId));
      } else {
        alert(`Failed to delete! Server returned ${response.status}.`);
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
            <th>Category</th>
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
                        name="category"
                        value={editFormData.category}
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
                    <td>{product.category}</td>
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
