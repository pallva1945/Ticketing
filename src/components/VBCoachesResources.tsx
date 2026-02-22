import React, { useState } from 'react';
import { BookOpen, ChevronRight, Target, Crosshair, TrendingUp, ArrowLeft, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

function useIsDark() {
  const { theme } = useTheme();
  return theme === 'dark';
}

function ShootingGuidelinesArticle() {
  const isDark = useIsDark();

  const sectionHeaderClass = `text-lg font-bold mt-8 mb-4 pb-2 border-b-2 ${isDark ? 'text-orange-400 border-orange-500/30' : 'text-orange-700 border-orange-200'}`;
  const subHeaderClass = `text-base font-semibold mt-6 mb-3 pb-1.5 border-b ${isDark ? 'text-gray-200 border-gray-700/50' : 'text-gray-800 border-gray-200'}`;
  const subSubHeaderClass = `text-sm font-semibold mt-4 mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`;
  const textClass = `text-sm leading-relaxed mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`;
  const strongClass = isDark ? 'text-orange-400 font-semibold' : 'text-orange-700 font-semibold';
  const noteClass = `rounded-xl p-4 my-5 border-l-4 ${isDark ? 'bg-orange-500/5 border-orange-500/40 text-gray-300' : 'bg-orange-50 border-orange-400 text-gray-700'}`;
  const listClass = `list-disc ml-5 mb-4 space-y-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`;
  const olClass = `list-decimal ml-5 mb-4 space-y-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`;
  const nestedListClass = `list-disc ml-5 mt-2 space-y-1 text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`;

  const levelCardClass = (color: string) => `rounded-xl p-4 mb-3 border ${isDark ? `bg-${color}-500/5 border-${color}-500/20` : `bg-${color}-50 border-${color}-200`}`;

  const levels = [
    { level: 1, name: 'Bad Shooter', range: '<50%', color: 'red', desc: 'Players who consistently shoot below 50% from the top of the key in spot-up situations.', focus: 'Solely on fundamental form development. These players should avoid shooting in games until significant improvement is shown.' },
    { level: 2, name: 'Incapable', range: '50-60%', color: 'orange', desc: 'Players consistently shooting between 50% and 60% from the top of the key in spot-up situations.', focus: 'While capable of occasional game shots, high volume should be avoided. Primary focus remains on improving form and consistency from spot-up positions.' },
    { level: 3, name: 'Capable', range: '60-65%', color: 'yellow', desc: 'Players consistently shooting between 60% and 65%.', focus: 'These players can shoot effectively in games. Training should balance spot-up shots (approx. 60%) with basic movement shots (approx. 40%).' },
    { level: 4, name: 'Volume', range: '65-70%', color: 'blue', desc: 'Players consistently shooting between 65% and 70%.', focus: 'These are volume shooters who should be actively sought out for scoring opportunities in games. Training evolves to 40-50% spot-ups and 50-60% intermediate movement shots (including on-ball shots) and basic movement shots (e.g., replacements).' },
    { level: 5, name: 'Elite Shooter', range: '70%+', color: 'green', desc: 'Players consistently shooting 70% or higher.', focus: 'Elite shooters should be encouraged to take high volumes of shots in games. Training emphasizes advanced movement shots (playmaking) and very little spot-up work (approx. 25%), with the majority (75%) dedicated to various movement scenarios.' },
  ];

  const levelColors: Record<string, { bg: string; border: string; badge: string; text: string }> = {
    red: {
      bg: isDark ? 'bg-red-500/5' : 'bg-red-50',
      border: isDark ? 'border-red-500/20' : 'border-red-200',
      badge: isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700',
      text: isDark ? 'text-red-400' : 'text-red-700',
    },
    orange: {
      bg: isDark ? 'bg-orange-500/5' : 'bg-orange-50',
      border: isDark ? 'border-orange-500/20' : 'border-orange-200',
      badge: isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-700',
      text: isDark ? 'text-orange-400' : 'text-orange-700',
    },
    yellow: {
      bg: isDark ? 'bg-yellow-500/5' : 'bg-yellow-50',
      border: isDark ? 'border-yellow-500/20' : 'border-yellow-200',
      badge: isDark ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700',
      text: isDark ? 'text-yellow-400' : 'text-yellow-700',
    },
    blue: {
      bg: isDark ? 'bg-blue-500/5' : 'bg-blue-50',
      border: isDark ? 'border-blue-500/20' : 'border-blue-200',
      badge: isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700',
      text: isDark ? 'text-blue-400' : 'text-blue-700',
    },
    green: {
      bg: isDark ? 'bg-green-500/5' : 'bg-green-50',
      border: isDark ? 'border-green-500/20' : 'border-green-200',
      badge: isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700',
      text: isDark ? 'text-green-400' : 'text-green-700',
    },
  };

  const phases = [
    { name: 'The Catch', icon: '1' },
    { name: 'The Dip', icon: '2' },
    { name: 'The Flow', icon: '3' },
    { name: 'The Follow-Through', icon: '4' },
  ];

  return (
    <div>
      <p className={textClass}>
        Welcome, Coaches! This guide outlines our philosophy and methodology for teaching and developing effective shooting skills within the Pallacanestro Varese youth program. Our goal is to foster consistent, efficient, and adaptable shooters across all age groups.
      </p>

      <div className={`h-px my-6 ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />

      <h2 className={sectionHeaderClass}>I. Shooting Principles: The Four Phases of the Shot</h2>
      <p className={textClass}>Every consistent shot can be broken down into four fundamental phases:</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
        {phases.map((p, i) => (
          <div key={i} className={`rounded-xl p-3 text-center border ${isDark ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white border-gray-200 shadow-sm'}`}>
            <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-sm font-bold ${isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-700'}`}>
              {p.icon}
            </div>
            <p className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{p.name}</p>
          </div>
        ))}
      </div>

      <h3 className={subHeaderClass}>A. The Catch</h3>
      <p className={textClass}>This phase focuses on preparing the body and hands to initiate the shot.</p>
      <h4 className={subSubHeaderClass}>Footwork:</h4>
      <ul className={listClass}>
        <li><span className={strongClass}>The 3-Step Gather ("Walk Up the Shot"):</span> For developing shooters, we emphasize a "right-left-right" gather (for a right-handed shooter). This sequence involves a forward momentum from approximately 1.5 to 2 meters outside the three-point line, allowing players to generate significant power, making the shot feel more effortless.</li>
        <li><span className={strongClass}>Corner Exceptions:</span> In corner situations, where sideline space is limited, the "right-left-right" sequence adapts. The initial "right" step is minimal, with the "left" and subsequent "right" steps occurring more laterally, maintaining the gather's intent.</li>
        <li><span className={strongClass}>Avoid Jumping into the Shot:</span> Jumping <em>into</em> the catch can dissipate energy and hinder the creation of upward and forward momentum, leading to an over-reliance on upper body strength.</li>
        <li><span className={strongClass}>Body Positioning:</span> The body should be square to the basket, with the shooting-side foot (e.g., right foot for a right-handed shooter) positioned approximately half a foot ahead of the non-shooting foot. Knees should be shoulder-width apart.</li>
        <li><span className={strongClass}>Catch Point:</span> The ball is ideally caught as the non-shooting foot (e.g., left foot) lands.</li>
      </ul>
      <h4 className={subSubHeaderClass}>Hand Position:</h4>
      <ul className={listClass}>
        <li><span className={strongClass}>Loaded Wrist:</span> The shooting wrist must be loaded (flexed back) upon receiving the ball, ready to propel the shot.</li>
      </ul>

      <h3 className={subHeaderClass}>B. The Dip</h3>
      <p className={textClass}>Following the catch, the shooter transitions into the "Starting Position."</p>
      <ul className={listClass}>
        <li><span className={strongClass}>Action:</span> After catching the ball on the non-shooting foot (e.g., left step), the shooter should dip the ball while simultaneously stepping onto the shooting-side foot (e.g., right step). This combined movement defines the "Dip."</li>
        <li><span className={strongClass}>Starting Position:</span> This is a relaxed, athletic stance:
          <ul className={nestedListClass}>
            <li>Face up, eyes on the target.</li>
            <li>Shoulders square to the basket.</li>
            <li>Ball positioned at hip height, slightly away from the body.</li>
            <li>Wrist loaded.</li>
            <li>Elbows comfortably extended at approximately a 115-degree angle (almost straight).</li>
            <li>Slight bend in the knees and hips (butt barely back), almost imperceptible, indicating readiness to explode upward.</li>
          </ul>
        </li>
        <li><span className={strongClass}>Avoid:</span> Holding the ball too high or not dipping, holding the ball too close to the body, dipping the ball excessively low, or being overly squatted. These common errors restrict natural power transfer.</li>
      </ul>

      <h3 className={subHeaderClass}>C. The Flow</h3>
      <p className={textClass}>The "Flow" is the continuous, upward motion that generates the shot.</p>
      <ul className={listClass}>
        <li><span className={strongClass}>Initiation:</span> From the "Starting Position" (established on the shooting-side step/dip), the body initiates a quick, controlled "down and up" movement. This leverages the stretch reflex for maximum power generation.</li>
        <li><span className={strongClass}>Ball Path:</span> Initially, as the body dips slightly <em>down</em>, the ball momentarily maintains its position. It then seamlessly joins the <em>upward</em> momentum, moving in a straight line, passing in front of the face, and extending all the way up to the shooting point above the head.</li>
        <li><span className={strongClass}>Execution:</span> This movement must be fluid and coordinated. The ball should be released at the absolute peak of the upward extension of all contributing body components (legs, torso, arm).</li>
      </ul>

      <h3 className={subHeaderClass}>D. The Follow-Through</h3>
      <p className={textClass}>The "Follow-Through" ensures precision and imparts crucial spin on the ball.</p>
      <ul className={listClass}>
        <li><span className={strongClass}>Action:</span> The shooting wrist "snaps through" the ball, with the fingertips (especially the index and middle fingers) being the last contact point. This action provides extra control and precision, creating the desirable backspin effect that enhances trajectory and soft bounces.</li>
        <li><span className={strongClass}>Visual:</span> The hand should finish in a "swan neck" or "reaching into the cookie jar" position, pointing directly at the basket.</li>
      </ul>

      <div className={`h-px my-6 ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />

      <h2 className={sectionHeaderClass}>II. Assessment and Player Development Levels</h2>
      <p className={textClass}>Our program employs a structured assessment to guide individual player development. While good form is crucial, we recognize that sometimes effective shooters may have unconventional mechanics. Our priority is to optimize performance.</p>

      <div className={noteClass}>
        <div className="flex items-start gap-2">
          <Info size={16} className={`flex-shrink-0 mt-0.5 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
          <div>
            <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-orange-400' : 'text-orange-700'}`}>Practice vs. Game Performance</p>
            <p className="text-sm">All percentages and levels discussed in this assessment are based on controlled, high-repetition practice sessions, not in-game statistics. Research and experience show that a player's in-game shooting percentage is typically about half of their practice percentage. For example, a player who shoots 60% in spot-up drills is expected to shoot around 30% in a live game scenario.</p>
          </div>
        </div>
      </div>

      <h3 className={subHeaderClass}>Assessment Philosophy:</h3>
      <ul className={listClass}>
        <li><span className={strongClass}>Effectiveness First:</span> If a player demonstrates high shooting percentages despite non-traditional form, we carefully consider whether extensive changes are beneficial. "If it's not broken, don't fix it."</li>
        <li><span className={strongClass}>Player Comfort vs. Performance:</span> While player comfort is important, for developing shooters who are not yet highly effective (e.g., shooting below 60% in spot-up situations), form adjustments are often necessary. Elite shooters (e.g., 70%+ from spot-ups) are less likely to benefit from radical changes based solely on their subjective comfort.</li>
        <li><span className={strongClass}>Age Considerations:</span> Changing established habits in older players can be more challenging. For them, sometimes prioritizing shot volume and confidence over radical form changes may be more appropriate, especially if they are already effective.</li>
      </ul>

      <h3 className={subHeaderClass}>Five-Level Shooting Assessment Scale:</h3>
      <p className={textClass}>We utilize a simple five-level scale, measured by spot-up shooting percentage from the top of the key:</p>

      <div className="space-y-3 my-5">
        {levels.map((l) => {
          const c = levelColors[l.color];
          return (
            <div key={l.level} className={`rounded-xl p-4 border ${c.bg} ${c.border}`}>
              <div className="flex items-center gap-3 mb-2">
                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold ${c.badge}`}>{l.level}</span>
                <div>
                  <span className={`font-semibold text-sm ${c.text}`}>{l.name}</span>
                  <span className={`ml-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>({l.range})</span>
                </div>
              </div>
              <p className={`text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{l.desc}</p>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}><span className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Focus:</span> {l.focus}</p>
            </div>
          );
        })}
      </div>

      <div className={`h-px my-6 ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />

      <h2 className={sectionHeaderClass}>III. Practice Shooting Principles: Methodology</h2>
      <p className={textClass}>Our practice methodology breaks down shooting into progressive stages, building skills layer by layer.</p>

      <h3 className={subHeaderClass}>A. Form Shooting</h3>
      <p className={textClass}>The objective of Form Shooting is to deconstruct the shot, allowing players to understand and internalize each mechanical component. We progressively increase distance and complexity, starting from the restricted area and moving towards the three-point line.</p>

      <div className={noteClass}>
        <div className="flex items-start gap-2">
          <Target size={16} className={`flex-shrink-0 mt-0.5 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
          <div>
            <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-orange-400' : 'text-orange-700'}`}>Core Concept</p>
            <p className="text-sm">Think of the "golf analogy" — the legs are the "clubs," and the upper body is the "swing." The upper body mechanics (the swing) should remain largely identical, regardless of distance, while the leg drive (the club) adjusts for power.</p>
          </div>
        </div>
      </div>

      <h4 className={subSubHeaderClass}>Progressive Steps:</h4>
      <div className="space-y-2 my-4">
        {[
          { step: 1, location: 'Restricted Circle', focus: 'Upper body mechanics only. No leg involvement.', emphasis: 'Starting Position, loaded wrist, fluid "Flow" (upward motion), and proper Follow-Through.' },
          { step: 2, location: 'Between Restricted Circle and Free-Throw Line', focus: 'Adds ankle extension.', emphasis: 'Maintain the initial concepts from Step 1 while smoothly integrating ankle drive.' },
          { step: 3, location: 'Free-Throw Line', focus: 'Adds the "Down and Up" body movement (the dip and initial flow).', emphasis: 'Ensure the full body rhythm (down and up) enhances shot power without compromising the established upper body and ankle mechanics.' },
          { step: 4, location: 'Long Two-Point Range', focus: 'Adds the "Walk Up the Shot" (right-left-right gather) and a small jump.', emphasis: 'Integrate the dynamic footwork and minimal jump for increased distance, always ensuring the core principles from previous steps remain intact.' },
          { step: 5, location: 'Three-Point Line', focus: 'Adds full leg power for a complete shot.', emphasis: 'Combine all previously learned elements into a cohesive, powerful, and fluid full shot.' },
        ].map((s) => (
          <div key={s.step} className={`flex gap-3 rounded-xl p-3 border ${isDark ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white border-gray-200 shadow-sm'}`}>
            <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold ${isDark ? 'bg-orange-500/15 text-orange-400' : 'bg-orange-100 text-orange-700'}`}>{s.step}</div>
            <div className="min-w-0">
              <p className={`text-xs font-semibold mb-0.5 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{s.location}</p>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{s.focus}</p>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}><span className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Emphasis:</span> {s.emphasis}</p>
            </div>
          </div>
        ))}
      </div>
      <p className={textClass}><span className={strongClass}>Adaptation:</span> If a player struggles to reach the rim from the three-point line, we adjust the progression, focusing on building leg power gradually rather than forcing extreme distance prematurely.</p>

      <h3 className={subHeaderClass}>B. Spot-Up Shots</h3>
      <ul className={listClass}>
        <li><span className={strongClass}>Principle:</span> Whether using one or two balls, the focus is on high pace and rhythm.</li>
        <li><span className={strongClass}>Execution:</span> Players should move actively and purposefully between shots and spots, simulating game intensity. "Train like a pro."</li>
      </ul>

      <h3 className={subHeaderClass}>C. Basic Movement Shots (Relocation)</h3>
      <p className={textClass}>These drills focus on fundamental movements to get open for a shot.</p>
      <div className="flex flex-wrap gap-2 my-3">
        {['Mash Out', 'Slide to the Corner', 'Replace', 'Replace from Top', 'Trailer'].map((d) => (
          <span key={d} className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium ${isDark ? 'bg-gray-800 text-gray-300 border border-gray-700' : 'bg-gray-100 text-gray-700 border border-gray-200'}`}>{d}</span>
        ))}
      </div>

      <h3 className={subHeaderClass}>D. Intermediate Movement Shots (On-Ball Actions)</h3>
      <p className={textClass}>These involve more complex movements, often with the ball in hand or coming off screens.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
        <div className={`rounded-xl p-3 border ${isDark ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white border-gray-200 shadow-sm'}`}>
          <h5 className={`text-xs font-semibold mb-2 ${isDark ? 'text-orange-400' : 'text-orange-700'}`}>DHO Series</h5>
          <div className="space-y-1">
            {['Come Off', 'Come Off One Dribble', 'Snatch', 'Snatch One Dribble'].map(d => (
              <p key={d} className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{d}</p>
            ))}
          </div>
        </div>
        <div className={`rounded-xl p-3 border ${isDark ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white border-gray-200 shadow-sm'}`}>
          <h5 className={`text-xs font-semibold mb-2 ${isDark ? 'text-orange-400' : 'text-orange-700'}`}>Off-Screen Actions</h5>
          <div className="space-y-1">
            {['Korver Cut', 'Baseline Multiple', 'Ferrero Action', 'Spain Pick & Roll'].map(d => (
              <p key={d} className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{d}</p>
            ))}
          </div>
        </div>
        <div className={`rounded-xl p-3 border ${isDark ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white border-gray-200 shadow-sm'}`}>
          <h5 className={`text-xs font-semibold mb-2 ${isDark ? 'text-orange-400' : 'text-orange-700'}`}>Random Actions</h5>
          <div className="space-y-1">
            {['Fly By', 'Pump Fake (Alviti)'].map(d => (
              <p key={d} className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{d}</p>
            ))}
          </div>
        </div>
      </div>

      <h3 className={subHeaderClass}>E. Advanced Movement Shots (Playmaking)</h3>
      <p className={textClass}>These are self-created shots, often off the dribble or from complex offensive actions.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
        <div className={`rounded-xl p-3 border ${isDark ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white border-gray-200 shadow-sm'}`}>
          <h5 className={`text-xs font-semibold mb-2 ${isDark ? 'text-orange-400' : 'text-orange-700'}`}>Pick & Roll (PnR) Actions</h5>
          <div className="space-y-1">
            {['Pick & Roll Handler', 'Pick & Pop', 'Pick & Roll Reject'].map(d => (
              <p key={d} className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{d}</p>
            ))}
          </div>
        </div>
        <div className={`rounded-xl p-3 border ${isDark ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white border-gray-200 shadow-sm'}`}>
          <h5 className={`text-xs font-semibold mb-2 ${isDark ? 'text-orange-400' : 'text-orange-700'}`}>Isolation (ISO) Actions</h5>
          <div className="space-y-1">
            {['Dribble Up', 'Step Back', 'Doncic Gather Back', 'Doncic Crossover', 'Iverson Crossover', 'LeBron Side Step', 'Punch Dribble'].map(d => (
              <p key={d} className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{d}</p>
            ))}
          </div>
        </div>
      </div>

      <div className={`h-px my-6 ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />

      <h2 className={sectionHeaderClass}>IV. Expectations and Development Standards</h2>
      <p className={textClass}>Consistent, daily shooting practice is paramount for significant progress. Our program sets clear benchmarks for player development:</p>

      <div className="space-y-2 my-4">
        {[
          { label: 'Form Development', detail: '15-year-old prospect', desc: 'A player starting with significant form issues should achieve 50% spot-up shooting proficiency within approximately two months of daily form work (e.g., during a summer program).' },
          { label: 'Level 2 → Level 3', detail: '15-year-old prospect', desc: 'A player starting the season at Level 2 (50% spot-up) should progress to Level 3 (60% spot-up) within four months.' },
          { label: 'Level 3 → Level 4', detail: '15-year-old prospect', desc: 'A player starting at Level 3 (60% spot-up) should reach Level 4 (65% spot-up) within four months.' },
          { label: 'Level 4 → Level 5', detail: '15-year-old prospect', desc: 'A player starting at Level 4 (65% spot-up) should achieve Level 5 (70%+ spot-up) within one year.' },
        ].map((b, i) => (
          <div key={i} className={`flex gap-3 rounded-xl p-3 border ${isDark ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white border-gray-200 shadow-sm'}`}>
            <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${isDark ? 'bg-orange-500/15' : 'bg-orange-100'}`}>
              <TrendingUp size={14} className={isDark ? 'text-orange-400' : 'text-orange-700'} />
            </div>
            <div className="min-w-0">
              <p className={`text-xs font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{b.label} <span className={`font-normal ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>({b.detail})</span></p>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{b.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className={noteClass}>
        <div className="flex items-start gap-2">
          <AlertTriangle size={16} className={`flex-shrink-0 mt-0.5 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
          <div>
            <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-orange-400' : 'text-orange-700'}`}>Accountability</p>
            <p className="text-sm">These pace and standards are designed to ensure all aspiring elite players reach at least Level 3 proficiency within one year. If these benchmarks are not met, it warrants a deeper discussion and review of our coaching methodologies and individual player plans.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface Article {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  component: React.FC;
}

const articles: Article[] = [
  {
    id: 'shooting-guidelines',
    title: 'Shooting Teaching & Training Guidelines',
    subtitle: 'Philosophy and methodology for developing effective shooting skills across all age groups',
    icon: Target,
    component: ShootingGuidelinesArticle,
  },
];

export function CoachesResourcesTab() {
  const isDark = useIsDark();
  const { t } = useLanguage();
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);

  const active = articles.find(a => a.id === selectedArticle);

  if (active) {
    const ArticleComponent = active.component;
    return (
      <div>
        <button
          onClick={() => setSelectedArticle(null)}
          className={`flex items-center gap-2 text-xs font-medium mb-5 px-3 py-1.5 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:text-orange-400 hover:bg-gray-800' : 'text-gray-500 hover:text-orange-600 hover:bg-orange-50'}`}
        >
          <ArrowLeft size={14} />
          Back to Resources
        </button>

        <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-[#111] border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
          <div className={`px-6 py-5 border-b ${isDark ? 'bg-gradient-to-r from-orange-500/10 to-transparent border-gray-800' : 'bg-gradient-to-r from-orange-50 to-white border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-orange-500/20' : 'bg-orange-100'}`}>
                <active.icon size={20} className={isDark ? 'text-orange-400' : 'text-orange-700'} />
              </div>
              <div>
                <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{active.title}</h2>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{active.subtitle}</p>
              </div>
            </div>
          </div>
          <div className="px-6 py-5">
            <ArticleComponent />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isDark ? 'bg-orange-500/15' : 'bg-orange-100'}`}>
            <BookOpen size={18} className={isDark ? 'text-orange-400' : 'text-orange-700'} />
          </div>
          <div>
            <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('Coaches Resources')}</h2>
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('Articles, guides, and reference materials for coaching staff')}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {articles.map((article) => (
          <button
            key={article.id}
            onClick={() => setSelectedArticle(article.id)}
            className={`text-left rounded-2xl border p-5 transition-all group ${isDark
              ? 'bg-[#111] border-gray-800 hover:border-orange-500/30 hover:bg-orange-500/5'
              : 'bg-white border-gray-200 shadow-sm hover:border-orange-300 hover:shadow-md'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${isDark ? 'bg-orange-500/15' : 'bg-orange-100'}`}>
              <article.icon size={20} className={isDark ? 'text-orange-400' : 'text-orange-700'} />
            </div>
            <h3 className={`text-sm font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{article.title}</h3>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{article.subtitle}</p>
            <div className={`flex items-center gap-1 mt-3 text-xs font-medium ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
              Read Article
              <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
