import { motion } from "framer-motion";
import PageTransition from "@/animations/PageTransition";
import {
  staggerContainer,
  slideUp,
} from "@/animations/variants";

import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import SectionHeading from "@/components/ui/SectionHeading";
import ScrollReveal from "@/components/ui/ScrollReveal";
import OptimizedImage from "@/components/ui/OptimizedImage";

const TEAM_MEMBERS = [
  {
    name: "Mr. Titus",
    role: "Executive Director",
    image: "/images/Team/Team_2.jpeg",
  },
  {
    name: "Mr. Obula Puli",
    role: "Deputy Director, Missions",
    image: "/images/Team/Team_3.jpeg",
  },
  {
    name: "Mr. Balaji Doddapanni",
    role: "Director, Social Development Programs — Heading Livelihood and Home Care Infrastructure Projects",
    image: "/images/Team/Team_4.jpeg",
  },
  {
    name: "Miss. Sirisha Govindu",
    role: "Administration, Mission",
    image: "/images/Team/Team_5.jpeg",
  },
  {
    name: "Dr. Lydia",
    role: "Director, Health Programs Development — Community, Health and Wellness Department",
    image: "/images/Team/Team_6.jpg",
  },
  {
    name: "Bhargavi Induri",
    role: "Director, Education and Welfare — Child and Women Empowerment Department",
    image: "/images/Team/Team_1.jpeg",
  },
];

function TeamCard({ member }) {
  return (
    <motion.div variants={slideUp} className="team-card">
      <div className="team-card__front">
        <OptimizedImage
          src={member.image}
          alt={member.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="team-card__overlay"></div>
      <div className="team-card__content">
        <h3 className="team-card__name">{member.name}</h3>
        <p className="team-card__role">{member.role}</p>
      </div>
    </motion.div>
  );
}

export default function Teams() {
  return (
    <PageTransition>
      <Section background="gray" className="pt-28 lg:pt-36">
        <Container>
          <SectionHeading
            title="Our Team"
            subtitle="Meet the dedicated leaders driving our mission to transform lives across Africa."
            highlight="Team"
          />

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-12"
          >
            {TEAM_MEMBERS.map((member) => (
              <TeamCard key={member.name} member={member} />
            ))}
          </motion.div>
        </Container>
      </Section>

      <style>{`
        .team-card {
          position: relative;
          width: 100%;
          aspect-ratio: 3 / 4;
          background: linear-gradient(-45deg, #2563EB 0%, #F37021 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
        }

        .team-card__front {
          position: absolute;
          inset: 0;
          z-index: 1;
        }

        .team-card__front img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .team-card__overlay {
          position: absolute;
          inset: 0;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(13, 27, 62, 0.3);
          transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
        }

        .team-card:hover {
          transform: rotate(-5deg) scale(1.05);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }

        .team-card:hover .team-card__overlay {
          background: rgba(13, 27, 62, 0.7);
        }

        .team-card__content {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 3;
          padding: 24px;
          background: linear-gradient(to top, rgba(13, 27, 62, 0.95), transparent);
          transform: translateY(60%);
          transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
        }

        .team-card:hover .team-card__content {
          transform: translateY(0);
        }

        .team-card__name {
          margin: 0;
          font-family: "Source Serif 4", Georgia, serif;
          font-size: 1.25rem;
          font-weight: 700;
          color: white;
        }

        .team-card__role {
          margin: 4px 0 0;
          font-family: "Hanken Grotesk", system-ui, sans-serif;
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.8);
        }

        @media (max-width: 640px) {
          .team-card:hover {
            transform: none;
            box-shadow: none;
          }
          .team-card__content {
            transform: translateY(0);
            padding: 16px;
          }
          .team-card__overlay {
            background: rgba(13, 27, 62, 0.6);
          }
          .team-card__name {
            font-size: 1.1rem;
          }
          .team-card__role {
            font-size: 0.8rem;
          }
        }
      `}</style>
    </PageTransition>
  );
}
