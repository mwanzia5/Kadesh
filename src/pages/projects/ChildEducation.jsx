import { Navigate } from "react-router-dom";
import EducationProject from "./EducationProject";

export function ProjectContent() {
  return <EducationProject projectId="child-education" />;
}

export default function ChildEducation() {
  return (
    <Navigate
      to="/projects/education?project=child-education#project-tabs"
      replace
    />
  );
}
