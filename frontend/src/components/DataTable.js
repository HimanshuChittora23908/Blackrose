import React, { useState } from "react";

const DataTable = ({ data, onRefresh, token }) => {
  const [editingRow, setEditingRow] = useState(null);
  const [editData, setEditData] = useState({});
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const rowsPerPage = 10;

  const handleEdit = (rowId, rowData) => {
    setEditingRow(rowId);
    setEditData(rowData);
  };

  const handleSave = async (rowId) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/csv/${rowId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editData),
        }
      );

      if (!response.ok) throw new Error("Failed to update row");

      setEditingRow(null);
      onRefresh();
    } catch (error) {
      setError("Failed to update row. Please try again.");
    }
  };

  const handleDelete = async (rowId) => {
    if (!window.confirm("Are you sure you want to delete this row?")) return;

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/csv/${rowId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to delete row");

      onRefresh();
    } catch (error) {
      setError("Failed to delete row. Please try again.");
    }
  };

  const handleRestore = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/restore`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to restore backup");

      onRefresh();
    } catch (error) {
      setError("Failed to restore backup. Please try again.");
    }
  };

  const paginatedData = data.slice(
    page * rowsPerPage,
    (page + 1) * rowsPerPage
  );

  return (
    <div>
      {error && (
        <div className="bg-red-500 p-3 rounded mb-4">
          {error}
          <button
            className="ml-2 text-sm underline"
            onClick={() => setError("")}
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="mb-4 flex justify-between">
        <button
          onClick={handleRestore}
          className="bg-yellow-600 px-4 py-2 rounded hover:bg-yellow-700"
        >
          Restore Backup
        </button>
        <div>
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="bg-gray-700 px-4 py-2 rounded hover:bg-gray-600 disabled:opacity-50 mr-2"
          >
            Previous
          </button>
          <button
            onClick={() => setPage(page + 1)}
            disabled={paginatedData.length < rowsPerPage}
            className="bg-gray-700 px-4 py-2 rounded hover:bg-gray-600 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              {data.length > 0 &&
                Object.keys(data[0]).map((header) => (
                  <th key={header} className="text-left p-2 bg-gray-700">
                    {header}
                  </th>
                ))}
              <th className="text-left p-2 bg-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, rowId) => (
              <tr key={rowId} className="border-b border-gray-700">
                {Object.entries(row).map(([key, value]) => (
                  <td key={key} className="p-2">
                    {editingRow === rowId ? (
                      <input
                        type="text"
                        value={editData[key] || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            [key]: e.target.value,
                          })
                        }
                        className="bg-gray-700 p-1 rounded w-full"
                      />
                    ) : (
                      value
                    )}
                  </td>
                ))}
                <td className="p-2">
                  {editingRow === rowId ? (
                    <button
                      onClick={() => handleSave(rowId)}
                      className="bg-green-600 px-3 py-1 rounded hover:bg-green-700 mr-2"
                    >
                      Save
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEdit(rowId, row)}
                      className="bg-blue-600 px-3 py-1 rounded hover:bg-blue-700 mr-2"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(rowId)}
                    className="bg-red-600 px-3 py-1 rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
