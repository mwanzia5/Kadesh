import { Navigate } from "react-router-dom";
import EducationProject from "./EducationProject";

export function ProjectContent() {
  return <EducationProject projectId="lumina-charis" />;
}

export default function LuminaCharis() {
  return (
    <Navigate
      to="/projects/education?project=lumina-charis#project-tabs"
      replace
    />
  );
}
