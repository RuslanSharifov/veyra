/**
 * Bottom Architectural Camera Walkthrough Animation Timeline
 * Allows creating camera paths, adding keyframes, scrubbing, and playing walkthroughs.
 */
import React, { useState, useEffect } from 'react';
import { Project, CameraKeyframe } from '../../types/cad';
import { 
  Play, Pause, Plus, Trash2, Video, 
  ChevronDown, ChevronUp, RotateCcw, Clock, Key 
} from 'lucide-react';

interface CameraTimelineProps {
  project: Project;
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentTime: number;
  onSeek: (time: number) => void;
  onAddKeyframe: () => void;
  onDeleteKeyframe: (keyframeId: string) => void;
  onUpdateDuration: (duration: number) => void;
}

export const CameraTimeline: React.FC<CameraTimelineProps> = ({
  project,
  isPlaying,
  onTogglePlay,
  currentTime,
  onSeek,
  onAddKeyframe,
  onDeleteKeyframe,
  onUpdateDuration,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const duration = project.animationDuration || 12;

  // Format mm:ss.s
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  const progressPercent = Math.min(100, Math.max(0, (currentTime / duration) * 100));

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(clickRatio * duration);
  };

  return (
    <div
      className={`absolute bottom-0 left-0 right-0 z-30 transition-transform duration-300 select-none ${
        isCollapsed ? 'translate-y-[calc(100%-24px)]' : 'translate-y-0'
      }`}
    >
      {/* Collapse/Expand Toggle Tab */}
      <div className="flex justify-center">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="bg-[#181d26] hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-t border-x border-slate-700/60 rounded-t-lg px-4 py-0.5 text-[11px] flex items-center gap-1 shadow-lg transition"
        >
          <Video size={12} className="text-sky-400" />
          <span>{isCollapsed ? 'Show Walkthrough Timeline' : 'Hide Timeline'}</span>
          {isCollapsed ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {/* Main Timeline Bar */}
      <div className="bg-[#12151c]/95 border-t border-slate-800 px-3 sm:px-6 py-2 sm:py-2.5 backdrop-blur shadow-2xl flex flex-col gap-1.5 sm:gap-2">
        <div className="flex items-center justify-between text-xs gap-2">
          {/* Left Controls: Play/Pause, Rewind, Time Readout */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            <button
              onClick={onTogglePlay}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-sky-500 hover:bg-sky-400 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-sky-500/20 transition active:scale-95 shrink-0"
              title={isPlaying ? 'Pause Walkthrough' : 'Play Architectural Walkthrough'}
            >
              {isPlaying ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" className="ml-0.5" />}
            </button>

            <button
              onClick={() => onSeek(0)}
              className="p-1 sm:p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0"
              title="Rewind to Start"
            >
              <RotateCcw size={14} />
            </button>

            <div className="font-mono text-slate-300 bg-slate-900/80 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded border border-slate-800 text-[10px] sm:text-[11px] shrink-0">
              <span className="text-sky-400 font-semibold">{formatTime(currentTime)}</span>
              <span className="text-slate-500 mx-1">/</span>
              <span className="text-slate-400">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Keyframes Count & Add Keyframe button */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={onAddKeyframe}
              className="flex items-center gap-1 sm:gap-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700/80 px-2 sm:px-3 py-1 rounded-md text-[11px] sm:text-xs font-medium shadow-sm transition active:scale-95 whitespace-nowrap"
              title="Save current 3D camera position and target as keyframe"
            >
              <Plus size={13} />
              <span className="hidden xs:inline sm:inline">Add Keyframe</span>
              <span className="xs:hidden">+KF</span>
            </button>

            <div className="h-4 w-[1px] bg-slate-800 hidden xs:block" />

            <div className="hidden xs:flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-400 shrink-0">
              <Clock size={12} />
              <select
                value={duration}
                onChange={(e) => onUpdateDuration(parseInt(e.target.value) || 12)}
                className="bg-slate-900 border border-slate-800 rounded px-1 py-0.5 text-slate-200 font-mono text-[10px] sm:text-[11px]"
              >
                <option value={8}>8s</option>
                <option value={12}>12s</option>
                <option value={16}>16s</option>
                <option value={24}>24s</option>
                <option value={30}>30s</option>
              </select>
            </div>
          </div>
        </div>

        {/* Timeline Scrub Track */}
        <div
          onClick={handleTimelineClick}
          className="relative h-6 bg-slate-900/90 rounded border border-slate-800 cursor-pointer overflow-hidden group"
        >
          {/* Subtle time tick marks */}
          <div className="absolute inset-0 flex justify-between pointer-events-none px-2 opacity-30">
            {Array.from({ length: 11 }).map((_, i) => (
              <div key={i} className="h-full w-[1px] bg-slate-500" />
            ))}
          </div>

          {/* Progress fill */}
          <div
            className="absolute top-0 bottom-0 left-0 bg-sky-500/20 border-r border-sky-400"
            style={{ width: `${progressPercent}%` }}
          />

          {/* Keyframe Markers on Timeline */}
          {project.cameraKeyframes.map((kf) => {
            const pos = Math.min(100, Math.max(0, (kf.time / duration) * 100));
            const isNear = Math.abs(currentTime - kf.time) < 0.3;
            return (
              <div
                key={kf.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSeek(kf.time);
                }}
                className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rotate-45 border transition cursor-pointer ${
                  isNear
                    ? 'bg-amber-400 border-white shadow-md shadow-amber-400/50 scale-125'
                    : 'bg-sky-400 border-slate-900 hover:scale-110'
                }`}
                style={{ left: `${pos}%` }}
                title={`Keyframe at ${kf.time.toFixed(1)}s (Click to jump)`}
              />
            );
          })}

          {/* Current Playhead Scrubber */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-white shadow-lg pointer-events-none -translate-x-1/2"
            style={{ left: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};
