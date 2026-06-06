import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { FieldOps } from "@/routes/FieldOps";
import { Dashboard } from "@/routes/Dashboard";
import { Dispatch } from "@/routes/Dispatch";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<FieldOps />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dispatch" element={<Dispatch />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
