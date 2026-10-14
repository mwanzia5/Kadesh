import { Navigate } from "react-router-dom";
import HealthcareProject from "./HealthcareProject";

export function ProjectContent() {
  return <HealthcareProject projectId="home-care" />;
}

export default function HomeCare() {
  return (
    <Navigate
      to="/projects/healthcare?project=home-care#project-tabs"
      replace
    />
  );
}
