import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";
import { AuthGate } from "./components/AuthGate";
import "./index.css";

Amplify.configure(outputs);

function App() {
  return <AuthGate />;
}

export default App;
