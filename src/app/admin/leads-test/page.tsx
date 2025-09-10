"use client";
import { useState } from "react";

export default function LeadsTest() {
  const [testData, setTestData] = useState("Loading...");

  const testAPI = async () => {
    try {
      const response = await fetch("/api/leads");
      if (response.ok) {
        const data = await response.json();
        setTestData(`API working! Found ${data.length} leads`);
      } else {
        setTestData(`API error: ${response.status}`);
      }
    } catch (error) {
      setTestData(`Error: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Leads Test Page
      </h1>
      <button
        onClick={testAPI}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
      >
        Test API
      </button>
      <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg">
        <p className="text-gray-900 dark:text-white">{testData}</p>
      </div>
    </div>
  );
}
