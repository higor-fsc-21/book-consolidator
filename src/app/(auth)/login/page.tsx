import { Login } from "@/views/Login";
import { login } from "./actions";

export default function LoginPage() {
  return <Login onLogin={login} />;
}
