import { Navigate } from "react-router-dom";
import SocialDevelopmentProject from "./SocialDevelopmentProject";

export function ProjectContent() {
  return <SocialDevelopmentProject projectId="borewell" />;
}

export default function Borewell() {
  return (
    <Navigate
      to="/projects/social-development?project=borewell#project-tabs"
      replace
    />
  );
}
