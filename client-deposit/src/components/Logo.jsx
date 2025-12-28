export const Logo = () => {
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-12 h-12">
        {/* Outer ring */}
        <div className="absolute inset-0 border-2 border-cyber-accent rounded-xl rotate-45 animate-pulse-slow"></div>
        {/* Inner hexagon effect */}
        <div className="absolute inset-2 border-2 border-cyber-purple rounded-lg animate-float"></div>
        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 bg-cyber-accent rounded-full shadow-[0_0_15px_rgba(0,217,255,0.8)]"></div>
        </div>
        {/* Scan line effect */}
        <div className="absolute inset-0 overflow-hidden rounded-xl opacity-30">
          <div className="w-full h-[2px] bg-cyber-accent animate-scan"></div>
        </div>
      </div>
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold tracking-tight text-cyber-accent">
          STX<span className="text-cyber-purple">Vault</span>
        </h1>
        <p className="text-xs text-cyber-text/60 tracking-wider">DEPOSIT & EARN</p>
      </div>
    </div>
  );
};
