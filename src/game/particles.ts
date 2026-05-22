// Lightweight particle system — emit-once, decay, render with canvas.
// All particle math runs in update(); draw() reads positions only.

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ax: number;
  ay: number;
  life: number; // ms remaining
  maxLife: number;
  size: number;
  color: string;
  shape: "circle" | "spark" | "star";
  rot?: number;
  vrot?: number;
};

export class ParticleSystem {
  private pool: Particle[] = [];

  get count(): number {
    return this.pool.length;
  }

  private push(p: Particle) {
    this.pool.push(p);
    if (this.pool.length > 200) this.pool.shift();
  }

  /** Coin pickup spark burst. */
  coinBurst(x: number, y: number) {
    for (let i = 0; i < 10; i++) {
      const a = (Math.PI * 2 * i) / 10 + Math.random() * 0.3;
      const sp = 0.18 + Math.random() * 0.18;
      this.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 0.06,
        ax: 0,
        ay: 0.0004,
        life: 550,
        maxLife: 550,
        size: 2.5 + Math.random() * 2,
        color: i % 2 ? "#fde047" : "#fbbf24",
        shape: "spark",
      });
    }
  }

  /** Ice-cream / heart pickup burst — red/pink. */
  heartBurst(x: number, y: number) {
    for (let i = 0; i < 18; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 0.12 + Math.random() * 0.22;
      this.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 0.1,
        ax: 0,
        ay: 0.0006,
        life: 750,
        maxLife: 750,
        size: 3 + Math.random() * 2.5,
        color: i % 3 === 0 ? "#fbcfe8" : "#ef4444",
        shape: "circle",
      });
    }
  }

  /** Power-up activation ring of pulses. */
  powerupBurst(x: number, y: number, color: string) {
    for (let i = 0; i < 14; i++) {
      const a = (Math.PI * 2 * i) / 14;
      const sp = 0.22;
      this.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        ax: 0,
        ay: 0,
        life: 600,
        maxLife: 600,
        size: 3.5,
        color,
        shape: "star",
        rot: 0,
        vrot: 0.01,
      });
    }
  }

  /** New-record fireworks. */
  fireworks(x: number, y: number) {
    const colors = ["#fde047", "#f472b6", "#22d3ee", "#a3e635", "#fb923c"];
    for (let i = 0; i < 36; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 0.15 + Math.random() * 0.4;
      this.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 0.15,
        ax: 0,
        ay: 0.0008,
        life: 1200 + Math.random() * 400,
        maxLife: 1400,
        size: 2 + Math.random() * 3,
        color: colors[i % colors.length],
        shape: "spark",
      });
    }
  }

  /** Hit impact debris. */
  hitBurst(x: number, y: number) {
    for (let i = 0; i < 14; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
      const sp = 0.18 + Math.random() * 0.22;
      this.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        ax: 0,
        ay: 0.0008,
        life: 700,
        maxLife: 700,
        size: 2 + Math.random() * 2,
        color: i % 2 ? "#fb7185" : "#fee2e2",
        shape: "spark",
      });
    }
  }

  update(dt: number) {
    for (const p of this.pool) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx += p.ax * dt;
      p.vy += p.ay * dt;
      if (p.vrot) p.rot = (p.rot ?? 0) + p.vrot * dt;
      p.life -= dt;
    }
    this.pool = this.pool.filter((p) => p.life > 0);
  }

  draw(ctx: CanvasRenderingContext2D) {
    for (const p of this.pool) {
      const a = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      if (p.shape === "circle") {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === "spark") {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      } else if (p.shape === "star") {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot ?? 0);
        for (let i = 0; i < 4; i++) {
          ctx.fillRect(-p.size * 0.2, -p.size, p.size * 0.4, p.size * 2);
          ctx.rotate(Math.PI / 4);
        }
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
  }

  clear() {
    this.pool.length = 0;
  }
}
