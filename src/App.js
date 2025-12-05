import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Cluster generators
const clusterGaussian = (n, sigma2) => {
  const cx = Math.random() * 2 - 1;
  const cy = Math.random() * 2 - 1;
  const points = [];
  for (let i = 0; i < n; i++) {
    const r = Math.sqrt(-2 * Math.log(Math.random())) * Math.sqrt(sigma2);
    const theta = Math.random() * 2 * Math.PI;
    points.push({ x: cx + r * Math.cos(theta), y: cy + r * Math.sin(theta) });
  }
  return points;
};

const clusterDonut = (n, sigma2) => {
  const cx = Math.random() * 2 - 1;
  const cy = Math.random() * 2 - 1;
  const radius = Math.random() * 1 + 0.5;
  const points = [];
  for (let i = 0; i < n; i++) {
    const r = radius + Math.sqrt(-2 * Math.log(Math.random())) * Math.sqrt(sigma2);
    const theta = Math.random() * 2 * Math.PI;
    points.push({ x: cx + r * Math.cos(theta), y: cy + r * Math.sin(theta) });
  }
  return points;
};

const clusterBlob = (n, sigma2) => {
  const cx = Math.random() * 2 - 1;
  const cy = Math.random() * 2 - 1;
  const angle = Math.random() * 2 * Math.PI;
  const sx = Math.random() * 2.2 + 0.3;
  const sy = Math.random() * 2.2 + 0.3;
  const points = [];
  for (let i = 0; i < n; i++) {
    const r = Math.sqrt(-2 * Math.log(Math.random())) * Math.sqrt(sigma2);
    const theta = Math.random() * 2 * Math.PI;
    const x = r * Math.cos(theta);
    const y = r * Math.sin(theta);
    const xRot = x * Math.cos(angle) - y * Math.sin(angle);
    const yRot = x * Math.sin(angle) + y * Math.cos(angle);
    points.push({ x: cx + xRot * sx, y: cy + yRot * sy });
  }
  return points;
};

const clusterConcentric = (n, sigma2, idx) => {
  const radii = [0.3, 0.7, 1.1];
  const radius = radii[idx % 3];
  const points = [];
  for (let i = 0; i < n; i++) {
    const r = radius + Math.sqrt(-2 * Math.log(Math.random())) * Math.sqrt(sigma2);
    const theta = Math.random() * 2 * Math.PI;
    points.push({ x: r * Math.cos(theta), y: r * Math.sin(theta) });
  }
  return points;
};

const clusterSmiley = (n, sigma2, idx) => {
  const components = ['head', 'left_eye', 'right_eye', 'mouth'];
  const component = components[idx % 4];
  const points = [];
  
  for (let i = 0; i < n; i++) {
    if (component === 'head') {
      const r = 1.2 + Math.sqrt(-2 * Math.log(Math.random())) * Math.sqrt(sigma2);
      const theta = Math.random() * 2 * Math.PI;
      points.push({ x: r * Math.cos(theta), y: r * Math.sin(theta) });
    } else if (component === 'left_eye') {
      const r = 0.15 + Math.sqrt(-2 * Math.log(Math.random())) * Math.sqrt(sigma2);
      const theta = Math.random() * 2 * Math.PI;
      points.push({ x: -0.4 + r * Math.cos(theta), y: 0.3 + r * Math.sin(theta) });
    } else if (component === 'right_eye') {
      const r = 0.15 + Math.sqrt(-2 * Math.log(Math.random())) * Math.sqrt(sigma2);
      const theta = Math.random() * 2 * Math.PI;
      points.push({ x: 0.4 + r * Math.cos(theta), y: 0.3 + r * Math.sin(theta) });
    } else {
      const theta = Math.random() * 0.6 * Math.PI + 1.2 * Math.PI;
      const r = 0.6 + Math.sqrt(-2 * Math.log(Math.random())) * Math.sqrt(sigma2);
      points.push({ x: r * Math.cos(theta), y: -0.2 + r * Math.sin(theta) });
    }
  }
  return points;
};

const clusterSemicircles = (n, sigma2, idx) => {
  const radius = 0.8;
  const points = [];
  
  for (let i = 0; i < n; i++) {
    const r = radius + Math.sqrt(-2 * Math.log(Math.random())) * Math.sqrt(sigma2);
    if (idx % 2 === 0) {
      const theta = Math.random() * Math.PI;
      points.push({ x: r * Math.cos(theta), y: r * Math.sin(theta) });
    } else {
      const theta = Math.random() * Math.PI + Math.PI;
      points.push({ x: radius + r * Math.cos(theta), y: r * Math.sin(theta) });
    }
  }
  return points;
};

const clusterGenerators = {
  'Gaussian': clusterGaussian,
  'Donut': clusterDonut,
  'Blob': clusterBlob,
  'Concentric': clusterConcentric,
  'Smiley': clusterSmiley,
  'Semicircles': clusterSemicircles
};

// Simple K-means implementation
const kmeans = (points, k, maxIter = 100) => {
  let centroids = points.slice(0, k).map(p => ({ ...p }));
  let labels = new Array(points.length).fill(0);
  
  for (let iter = 0; iter < maxIter; iter++) {
    // Assign points to nearest centroid
    for (let i = 0; i < points.length; i++) {
      let minDist = Infinity;
      for (let j = 0; j < k; j++) {
        const dist = Math.sqrt(
          Math.pow(points[i].x - centroids[j].x, 2) + 
          Math.pow(points[i].y - centroids[j].y, 2)
        );
        if (dist < minDist) {
          minDist = dist;
          labels[i] = j;
        }
      }
    }
    
    // Update centroids
    const newCentroids = Array(k).fill(null).map(() => ({ x: 0, y: 0, count: 0 }));
    for (let i = 0; i < points.length; i++) {
      newCentroids[labels[i]].x += points[i].x;
      newCentroids[labels[i]].y += points[i].y;
      newCentroids[labels[i]].count++;
    }
    
    let changed = false;
    for (let j = 0; j < k; j++) {
      if (newCentroids[j].count > 0) {
        const newX = newCentroids[j].x / newCentroids[j].count;
        const newY = newCentroids[j].y / newCentroids[j].count;
        if (Math.abs(newX - centroids[j].x) > 0.0001 || Math.abs(newY - centroids[j].y) > 0.0001) {
          changed = true;
        }
        centroids[j] = { x: newX, y: newY };
      }
    }
    
    if (!changed) break;
  }
  
  return { labels, centroids };
};

// Simple DBSCAN implementation
const dbscan = (points, eps, minSamples) => {
  const labels = new Array(points.length).fill(-1);
  let clusterId = 0;
  
  for (let i = 0; i < points.length; i++) {
    if (labels[i] !== -1) continue;
    
    const neighbors = [];
    for (let j = 0; j < points.length; j++) {
      const dist = Math.sqrt(
        Math.pow(points[i].x - points[j].x, 2) + 
        Math.pow(points[i].y - points[j].y, 2)
      );
      if (dist <= eps) neighbors.push(j);
    }
    
    if (neighbors.length < minSamples) {
      labels[i] = -1; // noise
      continue;
    }
    
    labels[i] = clusterId;
    const queue = [...neighbors];
    
    while (queue.length > 0) {
      const idx = queue.shift();
      if (labels[idx] === -1) labels[idx] = clusterId;
      if (labels[idx] !== -1 && labels[idx] !== clusterId) continue;
      
      labels[idx] = clusterId;
      
      const newNeighbors = [];
      for (let j = 0; j < points.length; j++) {
        const dist = Math.sqrt(
          Math.pow(points[idx].x - points[j].x, 2) + 
          Math.pow(points[idx].y - points[j].y, 2)
        );
        if (dist <= eps) newNeighbors.push(j);
      }
      
      if (newNeighbors.length >= minSamples) {
        for (const n of newNeighbors) {
          if (labels[n] === -1) queue.push(n);
        }
      }
    }
    
    clusterId++;
  }
  
  return labels;
};

export default function ClusterVisualizer() {
  const [shape, setShape] = useState('Gaussian');
  const [totalPoints, setTotalPoints] = useState(600);
  const [numClusters, setNumClusters] = useState(4);
  const [sigma2, setSigma2] = useState(0.05);
  const [addNoise, setAddNoise] = useState(false);
  const [noiseRatio, setNoiseRatio] = useState(0.2);
  const [algorithm, setAlgorithm] = useState('K-means');
  const [k, setK] = useState(4);
  const [eps, setEps] = useState(0.3);
  const [minSamples, setMinSamples] = useState(5);
  const [colorByActual, setColorByActual] = useState(false);
  
  const [points, setPoints] = useState([]);
  const [actualLabels, setActualLabels] = useState([]);
  const [clusterLabels, setClusterLabels] = useState([]);
  const [centroids, setCentroids] = useState([]);

  const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e', '#95a5a6', '#d35400'];

  const generatePoints = () => {
    let k = numClusters;
    if (shape === 'Concentric') k = 3;
    else if (shape === 'Smiley') k = 4;
    else if (shape === 'Semicircles') k = 2;
    
    const ptsPerCluster = Math.floor(totalPoints / k);
    let allPoints = [];
    let labels = [];
    
    for (let i = 0; i < k; i++) {
      const clusterPts = clusterGenerators[shape](ptsPerCluster, sigma2, i);
      allPoints = [...allPoints, ...clusterPts];
      labels = [...labels, ...new Array(ptsPerCluster).fill(i)];
    }
    
    if (addNoise) {
      const noiseCount = Math.floor(totalPoints * noiseRatio);
      const xMin = Math.min(...allPoints.map(p => p.x));
      const xMax = Math.max(...allPoints.map(p => p.x));
      const yMin = Math.min(...allPoints.map(p => p.y));
      const yMax = Math.max(...allPoints.map(p => p.y));
      
      for (let i = 0; i < noiseCount; i++) {
        allPoints.push({
          x: Math.random() * (xMax - xMin) + xMin,
          y: Math.random() * (yMax - yMin) + yMin
        });
        labels.push(-1);
      }
    }
    
    setPoints(allPoints);
    setActualLabels(labels);
    updateClustering(allPoints, labels);
  };

  const updateClustering = (pts = points, actLabels = actualLabels) => {
    if (pts.length === 0) return;
    
    if (algorithm === 'K-means') {
      const result = kmeans(pts, k);
      setClusterLabels(result.labels);
      setCentroids(result.centroids);
    } else if (algorithm === 'DBSCAN') {
      const labels = dbscan(pts, eps, minSamples);
      setClusterLabels(labels);
      setCentroids([]);
    }
  };

  useEffect(() => {
    if (points.length > 0) {
      updateClustering();
    }
  }, [algorithm, k, eps, minSamples]);

  const pdfData = [];
  const sigma = Math.sqrt(sigma2);
  for (let i = 0; i <= 100; i++) {
    const r = (i / 100) * 8 * sigma - 4 * sigma;
    const pdf = (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-(r * r) / (2 * sigma2));
    pdfData.push({ r, pdf });
  }

  const plotData = points.map((p, i) => ({
    ...p,
    cluster: colorByActual ? actualLabels[i] : clusterLabels[i]
  }));

  return (
    <div className="w-full h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Cluster Generator & Visualizer</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Panel - Generation Controls */}
          <div className="bg-white rounded-lg shadow p-4 space-y-3">
            <h2 className="text-xl font-semibold mb-3">Generation Settings</h2>
            
            <div>
              <label className="block text-sm font-medium mb-1">Cluster Shape</label>
              <select value={shape} onChange={e => setShape(e.target.value)} className="w-full p-2 border rounded">
                {Object.keys(clusterGenerators).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Total Points</label>
              <input type="number" value={totalPoints} onChange={e => setTotalPoints(parseInt(e.target.value))} className="w-full p-2 border rounded" />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Clusters</label>
              <input type="number" value={numClusters} onChange={e => setNumClusters(parseInt(e.target.value))} className="w-full p-2 border rounded" />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Sigma² (Variance)</label>
              <input type="number" step="0.01" value={sigma2} onChange={e => setSigma2(parseFloat(e.target.value))} className="w-full p-2 border rounded" />
            </div>
            
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={addNoise} onChange={e => setAddNoise(e.target.checked)} id="noise" />
              <label htmlFor="noise" className="text-sm font-medium">Add uniform noise</label>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Noise Ratio</label>
              <input type="number" step="0.1" value={noiseRatio} onChange={e => setNoiseRatio(parseFloat(e.target.value))} className="w-full p-2 border rounded" />
            </div>
            
            <button onClick={generatePoints} className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 font-medium">
              Generate Points
            </button>

            <div className="mt-4 pt-4 border-t">
              <h3 className="text-sm font-semibold mb-2">Radial PDF</h3>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={pdfData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="r" tick={{fontSize: 10}} />
                  <YAxis tick={{fontSize: 10}} />
                  <Line type="monotone" dataKey="pdf" stroke="#3498db" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Center Panel - Visualization */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-xl font-semibold mb-3">Cluster Visualization</h2>
            <ResponsiveContainer width="100%" height={500}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid />
                <XAxis type="number" dataKey="x" domain={['auto', 'auto']} />
                <YAxis type="number" dataKey="y" domain={['auto', 'auto']} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter data={plotData} shape="circle">
                  {plotData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.cluster === -1 ? '#95a5a6' : colors[entry.cluster % colors.length]} />
                  ))}
                </Scatter>
                {centroids.map((c, i) => (
                  <Scatter key={`centroid-${i}`} data={[c]} fill="red" shape="cross" />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* Right Panel - Clustering Controls */}
          <div className="bg-white rounded-lg shadow p-4 space-y-3">
            <h2 className="text-xl font-semibold mb-3">Clustering Settings</h2>
            
            <div>
              <label className="block text-sm font-medium mb-1">Algorithm</label>
              <select value={algorithm} onChange={e => setAlgorithm(e.target.value)} className="w-full p-2 border rounded">
                <option value="K-means">K-means</option>
                <option value="DBSCAN">DBSCAN</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">K (clusters for K-means)</label>
              <input type="number" value={k} onChange={e => setK(parseInt(e.target.value))} className="w-full p-2 border rounded" />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">DBSCAN eps</label>
              <input type="number" step="0.1" value={eps} onChange={e => setEps(parseFloat(e.target.value))} className="w-full p-2 border rounded" />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">DBSCAN min_samples</label>
              <input type="number" value={minSamples} onChange={e => setMinSamples(parseInt(e.target.value))} className="w-full p-2 border rounded" />
            </div>
            
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={colorByActual} onChange={e => setColorByActual(e.target.checked)} id="colorActual" />
              <label htmlFor="colorActual" className="text-sm font-medium">Color by actual clusters</label>
            </div>
            
            <button onClick={() => updateClustering()} className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 font-medium">
              Update Clustering
            </button>

            <div className="mt-4 pt-4 border-t text-sm text-gray-600">
              <p className="font-medium mb-2">Instructions:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Choose a shape and generate points</li>
                <li>Adjust clustering parameters</li>
                <li>Toggle "Color by actual" to compare</li>
                <li>Red crosses = K-means centroids</li>
                <li>Gray points = DBSCAN noise</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
