import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";
import { AuthGate } from "./components/AuthGate";
import { ToastProvider } from "./components/Toast";
import "./index.css";

Amplify.configure(outputs);

function App() {
  return (
    <ToastProvider>
      <AuthGate />
    </ToastProvider>
  );
}

export default App;
