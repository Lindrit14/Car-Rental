import { useEffect, useState } from "react";
import Modal from "./Modal";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  useEffect(() => {
    if (isOpen) setActiveTab("login");
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab("login")}
            className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "login"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setActiveTab("register")}
            className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "register"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Register
          </button>
        </div>

        {activeTab === "login" ? (
          <LoginForm
            onSuccess={onClose}
            onSwitchToRegister={() => setActiveTab("register")}
          />
        ) : (
          <RegisterForm
            onSuccess={onClose}
            onSwitchToLogin={() => setActiveTab("login")}
          />
        )}
      </div>
    </Modal>
  );
}
