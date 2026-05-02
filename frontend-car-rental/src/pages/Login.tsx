import { useNavigate } from "react-router-dom";
import LoginForm from "../components/LoginForm";

export default function Login() {
  const navigate = useNavigate();

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Login</h2>
      <LoginForm
        onSuccess={(res) => navigate(res.role === "ADMIN" ? "/admin" : "/")}
      />
    </div>
  );
}
