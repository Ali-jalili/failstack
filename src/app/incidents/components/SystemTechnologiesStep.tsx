/** @format */

const technologies = [
  "PostgreSQL",
  "Redis",
  "MongoDB",
  "MySQL",
  "Elasticsearch",
  "RabbitMQ",
  "Kafka",
  "Nginx",
  "Apache",
  "Node.js",
  "Django",
  "Flask",
  "Spring Boot",
  "Express.js",
  "Laravel",
  "Ruby on Rails",
  "ASP.NET Core",
];

export default function SystemTechnologiesStep() {
  return (
    <div>
      <label htmlFor="system">System</label>
      <input type="text" id="system" />

      <label htmlFor="technologies">Technologies</label>
    </div>
  );
}
