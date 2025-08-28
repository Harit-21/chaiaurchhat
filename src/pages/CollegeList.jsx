import React from "react";
import { useNavigate } from "react-router-dom";

const colleges = [
  {
    id: "du-north-campus",
    name: "Delhi University - North Campus",
    city: "Delhi",
    image:
      "https://images.unsplash.com/photo-1541233349642-6e425fe6190e?auto=format&fit=crop&w=800&q=60",
  },
  {
    id: "fergusson-college",
    name: "Fergusson College",
    city: "Pune",
    image:
      "https://images.unsplash.com/photo-1601700591928-0c5ce8878f57?auto=format&fit=crop&w=800&q=60",
  },
  {
    id: "iit-bombay",
    name: "IIT Bombay",
    city: "Mumbai",
    image:
      "https://images.unsplash.com/photo-1597167053656-d6fe58e7365e?auto=format&fit=crop&w=800&q=60",
  },
];

const CollegeList = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6 max-w-5xl mx-auto">
      <h1 className="text-4xl font-extrabold mb-10 text-center text-primary">
        🎓 Choose Your College / School
      </h1>
      <div className="grid md:grid-cols-3 gap-10">
        {colleges.map((college) => (
          <div
            key={college.id}
            onClick={() => navigate(`/colleges/${college.id}`)}
            className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl cursor-pointer transform hover:scale-105 transition"
          >
            <img
              src={college.image}
              alt={college.name}
              className="h-40 w-full object-cover"
            />
            <div className="p-4">
              <h2 className="text-xl font-bold">{college.name}</h2>
              <p className="text-gray-500">{college.city}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CollegeList;
