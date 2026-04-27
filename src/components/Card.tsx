import React from 'react';

interface CardProps {
  title: string;
  description: string;
  children?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ title, description, children }) => {
  return (
    <div className="p-4 bg-white rounded-lg shadow-md border border-gray-200">
      <h3 className="text-lg font-bold text-text">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
};

export default Card;