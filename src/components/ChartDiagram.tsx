import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ChartData {
  type: 'line' | 'bar' | 'pie';
  title: string;
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
  }>;
}

interface ChartDiagramProps {
  data: ChartData;
}

export const ChartDiagram = ({ data }: ChartDiagramProps) => {
  const options: ChartOptions<any> = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#e5e5e5',
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: true,
        text: data.title,
        color: '#e5e5e5',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#6366f1',
        borderWidth: 1,
      },
    },
    scales: data.type !== 'pie' ? {
      y: {
        ticks: {
          color: '#9ca3af',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      x: {
        ticks: {
          color: '#9ca3af',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
    } : undefined,
  };

  const chartData = {
    labels: data.labels,
    datasets: data.datasets.map((dataset) => ({
      ...dataset,
      backgroundColor: dataset.backgroundColor || (
        data.type === 'pie' 
          ? ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6']
          : `rgba(99, 102, 241, ${data.type === 'line' ? 0.2 : 0.8})`
      ),
      borderColor: dataset.borderColor || '#6366f1',
      borderWidth: data.type === 'line' ? 2 : 1
    }))
  };

  return (
    <div
      style={{
        padding: '20px',
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        margin: '16px 0',
      }}
    >
      {data.type === 'line' && <Line options={options} data={chartData} />}
      {data.type === 'bar' && <Bar options={options} data={chartData} />}
      {data.type === 'pie' && <Pie options={options} data={chartData} />}
    </div>
  );
};
