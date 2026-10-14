import { Navigate } from "react-router-dom";
import HealthcareProject from "./HealthcareProject";

export function ProjectContent() {
  return <HealthcareProject projectId="ohana-care" />;
}

export default function OhanaCare() {
  return (
    <Navigate
      to="/projects/healthcare?project=ohana-care#project-tabs"
      replace
    />
  );
}
