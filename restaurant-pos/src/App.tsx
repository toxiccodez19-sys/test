import { useState } from "react";
import { useStore } from "@/store";
import { Sidebar } from "@/components/layout/Sidebar";
import { Dashboard } from "@/pages/Dashboard";
import { MenuManagement } from "@/pages/MenuManagement";
import { TableManagement } from "@/pages/TableManagement";
import { Orders } from "@/pages/Orders";
import { Kitchen } from "@/pages/Kitchen";
import { Billing } from "@/pages/Billing";
import { Reports } from "@/pages/Reports";
import type { PageType } from "@/types";

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>("dashboard");
  const store = useStore();

  function renderPage() {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard store={store} />;
      case "menu":
        return <MenuManagement store={store} />;
      case "tables":
        return <TableManagement store={store} onNavigate={setCurrentPage} />;
      case "orders":
        return <Orders store={store} />;
      case "kitchen":
        return <Kitchen store={store} />;
      case "billing":
        return <Billing store={store} />;
      case "reports":
        return <Reports store={store} />;
      default:
        return <Dashboard store={store} />;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        activeOrderCount={store.activeOrders.length}
      />
      <main className="ml-64 p-6">{renderPage()}</main>
    </div>
  );
}

export default App;
