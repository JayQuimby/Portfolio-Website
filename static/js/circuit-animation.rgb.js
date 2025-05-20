// Circuit Board Animation
class CircuitBoard {
  constructor() {
    // Canvas setup
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.zIndex = '-1';
    this.canvas.style.opacity = '0.6';
    document.body.appendChild(this.canvas);
    
    // Settings
    this.traces = [];
    this.traceCount = 40;
    this.pulseSpeed = 0.05;
    this.pulseWidth = 0.7;
    this.baseColor = 'rgb(80, 80, 80)';      
    this.pulseColorStart = 'rgba(248, 132, 54, 0.8)';     
    this.pulseColorMid = 'rgb(17, 172, 133)';     
    this.pulseColorEnd = 'rgba(134, 66, 212, 0.76)';     
    this.lineWidth = 3;
    this.nodeRadius = 2;
    
    // Initialize
    this.resize();
    this.createTraces();
    
    // Events
    window.addEventListener('resize', () => this.resize());
    
    // Start animation
    this.animate();
  }
  
  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    
    // Recreate traces when resized
    if (this.traces.length > 0) {
      this.createTraces();
    }
  }
  
  createTraces() {
    this.traces = [];
    
    for (let i = 0; i < this.traceCount; i++) {
      const isHorizontal = Math.random() > 0.4;
      const segments = 3 + Math.floor(Math.random() * 4); // 3-6 segments
      
      let trace = {
        points: [],
        nodes: [],
        pulses: [],
        horizontal: isHorizontal
      };
      
      // Create starting point
      let x, y;
      
      if (isHorizontal) {
        x = -50; // Start left of screen
        y = Math.random() * this.height;
      } else {
        x = Math.random() * this.width;
        y = -50; // Start above screen
      }
      
      trace.points.push({x, y});
      
      // Create trace segments with turns
      for (let j = 0; j < segments; j++) {
        const lastPoint = trace.points[trace.points.length - 1];
        let nextX, nextY;
        
        if ((j % 2 === 0) === isHorizontal) {
          // Horizontal movement
          const direction = Math.random() > 0.5 ? 1 : -1;
          const distance = 100 + Math.random() * 200;
          nextX = lastPoint.x + (distance * direction);
          nextY = lastPoint.y;
        } else {
          // Vertical movement
          const direction = Math.random() > 0.5 ? 1 : -1;
          const distance = 80 + Math.random() * 150;
          nextX = lastPoint.x;
          nextY = lastPoint.y + (distance * direction);
        }
        
        trace.points.push({x: nextX, y: nextY});
        
        // Add node at each corner
        trace.nodes.push({
          x: nextX, 
          y: nextY,
          radius: this.nodeRadius + Math.random() * 2
        });
      }
      
      // Extend the final segment to ensure it goes off-screen
      const lastPoint = trace.points[trace.points.length - 1];
      const secondLastPoint = trace.points[trace.points.length - 2];
      
      // Calculate direction of final segment
      const isLastSegmentHorizontal = lastPoint.y === secondLastPoint.y;
      
      if (isLastSegmentHorizontal) {
        trace.points.push({
          x: lastPoint.x > secondLastPoint.x ? this.width + 50 : -50,
          y: lastPoint.y
        });
      } else {
        trace.points.push({
          x: lastPoint.x,
          y: lastPoint.y > secondLastPoint.y ? this.height + 50 : -50
        });
      }
      
      // Add pulses
      const pulseCount = 1 + Math.floor(Math.random() * 2);
      for (let p = 0; p < pulseCount; p++) {
        trace.pulses.push({
          position: Math.random(),
          speed: this.pulseSpeed + Math.random() * 0.002,
          size: this.pulseWidth + Math.random() * this.pulseWidth
        });
      }
      
      this.traces.push(trace);
    }
  }
  
  drawTrace(trace) {
    const ctx = this.ctx;
    
    // Draw the base path
    ctx.strokeStyle = this.baseColor;
    ctx.lineWidth = this.lineWidth;
    ctx.beginPath();
    ctx.moveTo(trace.points[0].x, trace.points[0].y);
    
    for (let i = 1; i < trace.points.length; i++) {
      ctx.lineTo(trace.points[i].x, trace.points[i].y);
    }
    
    ctx.stroke();
    
    // Draw nodes
    ctx.fillStyle = this.baseColor;
    for (const node of trace.nodes) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Draw pulses
    for (const pulse of trace.pulses) {
      this.drawPulse(trace, pulse);
    }
  }
  
  drawPulse(trace, pulse) {
    const ctx = this.ctx;
    const gradient = ctx.createLinearGradient(0, 0, this.width, this.height);
    
    // Get current pulse position along the path
    const totalLength = this.getPathLength(trace.points);
    const pulsePosition = this.getPositionAlongPath(trace.points, pulse.position * totalLength);
    
    if (!pulsePosition) return;
    
    // Create pulse gradient
    gradient.addColorStop(0, this.pulseColorStart);
    gradient.addColorStop(0.5, this.pulseColorMid);
    gradient.addColorStop(1, this.pulseColorEnd);
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = this.lineWidth * 1.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Draw pulse segment
    const pulseStart = this.getPositionAlongPath(trace.points, 
      Math.max(0, pulse.position * totalLength - pulse.size / 2));
    const pulseEnd = this.getPositionAlongPath(trace.points, 
      Math.min(totalLength, pulse.position * totalLength + pulse.size / 2));
    
    if (!pulseStart || !pulseEnd) return;
    
    ctx.beginPath();
    ctx.moveTo(pulseStart.x, pulseStart.y);
    
    // Find all points between pulse start and end
    let currentLength = 0;
    let startFound = false;
    let includePoints = [];
    
    for (let i = 1; i < trace.points.length; i++) {
      const prevPoint = trace.points[i-1];
      const currentPoint = trace.points[i];
      const segmentLength = this.getDistance(prevPoint, currentPoint);
      
      // If this segment contains our start point
      if (!startFound && currentLength + segmentLength >= pulse.position * totalLength - pulse.size / 2) {
        startFound = true;
      }
      
      // If we've found our start and need to include this point
      if (startFound) {
        includePoints.push(currentPoint);
      }
      
      // If this segment contains our end point
      if (currentLength + segmentLength >= pulse.position * totalLength + pulse.size / 2) {
        break;
      }
      
      currentLength += segmentLength;
    }
    
    // Draw lines to all points in our pulse segment
    for (const point of includePoints) {
      ctx.lineTo(point.x, point.y);
    }
    
    ctx.stroke();
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'miter';
    
    // Draw bright center of pulse
    ctx.strokeStyle = '#787878';
    ctx.lineWidth = this.lineWidth;
    ctx.beginPath();
    ctx.arc(pulsePosition.x, pulsePosition.y, 3, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  getDistance(point1, point2) {
    return Math.sqrt(
      Math.pow(point2.x - point1.x, 2) + 
      Math.pow(point2.y - point1.y, 2)
    );
  }
  
  getPathLength(points) {
    let length = 0;
    for (let i = 1; i < points.length; i++) {
      length += this.getDistance(points[i-1], points[i]);
    }
    return length;
  }
  
  getPositionAlongPath(points, targetLength) {
    let currentLength = 0;
    
    for (let i = 1; i < points.length; i++) {
      const prevPoint = points[i-1];
      const currentPoint = points[i];
      const segmentLength = this.getDistance(prevPoint, currentPoint);
      
      if (currentLength + segmentLength >= targetLength) {
        // Calculate position along this segment
        const remainingLength = targetLength - currentLength;
        const ratio = remainingLength / segmentLength;
        
        return {
          x: prevPoint.x + (currentPoint.x - prevPoint.x) * ratio,
          y: prevPoint.y + (currentPoint.y - prevPoint.y) * ratio
        };
      }
      
      currentLength += segmentLength;
    }
    
    return null;
  }
  
  updatePulses() {
    for (const trace of this.traces) {
      for (const pulse of trace.pulses) {
        pulse.position += pulse.speed * this.pulseSpeed;
        
        // Reset pulse when it reaches the end
        if (pulse.position > 1) {
          pulse.position = 0;
        }
      }
    }
  }
  
  animate() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // Draw all traces
    for (const trace of this.traces) {
      this.drawTrace(trace);
    }
    
    // Update pulse positions
    this.updatePulses();
    
    // Loop animation
    requestAnimationFrame(() => this.animate());
  }
}

// Initialize animation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new CircuitBoard();
});