import { Navigate } from "react-router-dom";
import SocialDevelopmentProject from "./SocialDevelopmentProject";

export function ProjectContent() {
  return <SocialDevelopmentProject projectId="bethlehem-bread" />;
}

export default function BethlehemBread() {
  return (
    <Navigate
      to="/projects/social-development?project=bethlehem-bread#project-tabs"
      replace
    />
  );
}
