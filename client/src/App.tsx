import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { FieldOps } from "@/routes/FieldOps";
import { Dashboard } from "@/routes/Dashboard";
import { Dispatch } from "@/routes/Dispatch";
import { Map } from "@/routes/Map";

/* ================================================================
   ROUTE ARCHITECTURE — Strict page-level organization
   ----------------------------------------------------------------
   1. PRIMARY WORKSPACE   (/ , /map)
      Core active operations, real-time status, daily actions.

   2. MANAGEMENT PORTAL  (/dashboard , /dispatch)
      Lists, records, data tables, structural configurations.
   ================================================================ */

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          {/* Primary Workspace */}
          <Route path="/" element={<FieldOps />} />
          <Route path="/map" element={<Map />} />

          {/* Management Portal */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dispatch" element={<Dispatch />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
