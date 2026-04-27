import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon }) => {
  return (
    <div className="flex items-center p-4 bg-white rounded shadow-md">
      <div className="p-3 text-white bg-primary rounded-full">
        {icon}
      </div>
      <div className="ml-4">
        <h3 className="text-lg font-bold text-text">{title}</h3>
        <p className="text-2xl font-semibold text-gray-800">{value}</p>
      </div>
    </div>
  );
};

export default MetricCard;