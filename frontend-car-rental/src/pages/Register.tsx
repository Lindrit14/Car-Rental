import { useNavigate } from "react-router-dom";
import RegisterForm from "../components/RegisterForm";

export default function Register() {
  const navigate = useNavigate();

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Register</h2>
      <RegisterForm
        onSuccess={(res) => navigate(res.role === "ADMIN" ? "/admin" : "/")}
      />
    </div>
  );
}
