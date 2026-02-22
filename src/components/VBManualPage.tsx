import React from 'react';
import { ChevronLeft, Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const VB_LOGO_URL = "https://i.imgur.com/e7khORs.png";

interface VBManualPageProps {
  onBack: () => void;
}

export const VBManualPage: React.FC<VBManualPageProps> = ({ onBack }) => {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage } = useLanguage();
  const isDark = theme === 'dark';

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const threePointData = [
    { season: '2014-15', attempted: 22.6, pct: 36.1 },
    { season: '2016-17', attempted: 22.6, pct: 36.5 },
    { season: '2018-19', attempted: 23.1, pct: 36.3 },
    { season: '2020-21', attempted: 23.9, pct: 36.8 },
    { season: '2022-23', attempted: 25.1, pct: 36.6 },
    { season: '2024-25', attempted: 27.5, pct: 36.7 },
  ];

  const shotSpectrumData = [
    { type: 'Rim', efg: 63 },
    { type: 'Short Mid', efg: 40 },
    { type: 'Long Mid', efg: 38 },
    { type: 'Corner 3', efg: 55 },
    { type: 'Above Break 3', efg: 48 },
  ];

  const efficiencyData = [
    { category: 'Transition', ppp: 1.12 },
    { category: 'Half-Court', ppp: 0.92 },
  ];

  const postUpData = [
    { season: '2014-15', freq: 9.8 },
    { season: '2016-17', freq: 8.3 },
    { season: '2018-19', freq: 6.6 },
    { season: '2020-21', freq: 5.7 },
    { season: '2022-23', freq: 4.8 },
    { season: '2024-25', freq: 3.6 },
  ];

  const longTwoData = [
    { season: '2014-15', pct: 24.1 },
    { season: '2016-17', pct: 20.3 },
    { season: '2018-19', pct: 17.5 },
    { season: '2020-21', pct: 14.7 },
    { season: '2022-23', pct: 12.8 },
    { season: '2024-25', pct: 10.5 },
  ];

  const sectionLinkClass = `px-2 py-1.5 rounded-lg text-xs tracking-[0.1em] uppercase font-medium transition-all duration-300 ${isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`;

  const h2Class = `text-2xl sm:text-3xl font-bold mb-6 pb-3 border-b-2 ${isDark ? 'text-orange-400 border-orange-800' : 'text-orange-600 border-orange-300'}`;
  const h3Class = `text-xl sm:text-2xl font-bold mt-8 mb-4 ${isDark ? 'text-orange-400' : 'text-orange-600'}`;
  const h4Class = `text-lg sm:text-xl font-bold mt-6 mb-3 ${isDark ? 'text-gray-200' : 'text-gray-800'}`;
  const h5Class = `text-base sm:text-lg font-bold mt-5 mb-2 pb-1 border-b ${isDark ? 'text-gray-300 border-gray-700' : 'text-gray-700 border-gray-200'}`;
  const pClass = `mb-4 leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`;
  const strongClass = isDark ? 'font-bold text-gray-100' : 'font-bold text-gray-800';
  const emOrangeClass = isDark ? 'italic text-orange-400' : 'italic text-orange-600';
  const ulClass = `pl-6 mb-4 space-y-2 list-disc ${isDark ? 'text-gray-300' : 'text-gray-600'}`;
  const olClass = `pl-6 mb-4 space-y-2 list-decimal ${isDark ? 'text-gray-300' : 'text-gray-600'}`;

  const thClass = `px-3 py-2 text-left text-xs uppercase font-bold tracking-wider ${isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-700 text-white'}`;
  const tdClass = (even: boolean) => `px-3 py-2 text-sm ${even ? (isDark ? 'bg-gray-800/50' : 'bg-gray-50') : (isDark ? 'bg-gray-900/50' : 'bg-white')} ${isDark ? 'text-gray-300 border-gray-700' : 'text-gray-600 border-gray-200'} border-b`;

  const infoBoxClass = `p-4 my-5 rounded-lg border-l-4 ${isDark ? 'bg-orange-900/20 border-orange-500 text-gray-300' : 'bg-orange-50 border-orange-500 text-gray-700'}`;

  const cardClass = `rounded-xl border shadow-sm overflow-hidden ${isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200'}`;

  const chartTooltipStyle = {
    backgroundColor: isDark ? '#1f2937' : '#ffffff',
    border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
    borderRadius: '8px',
    color: isDark ? '#e5e7eb' : '#374151',
  };

  const axisTickStyle = { fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 11 };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0a0a0a] text-white' : 'bg-[#fafafa] text-gray-900'}`}>
      {/* Fixed Nav */}
      <nav className={`fixed top-0 left-0 w-full z-50 backdrop-blur-xl ${isDark ? 'bg-[#0a0a0a]/90 border-b border-gray-800/50' : 'bg-[#fafafa]/90 border-b border-gray-200/50'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="hover:opacity-70 transition-opacity flex items-center gap-1">
              <ChevronLeft size={16} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
              <img src={VB_LOGO_URL} alt="VB" className="w-7 h-7 object-contain" />
            </button>
            <div className={`h-4 w-px ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
            <div className="hidden lg:flex items-center gap-1">
              <button onClick={() => scrollTo('philosophy')} className={sectionLinkClass}>Philosophy</button>
              <button onClick={() => scrollTo('development')} className={sectionLinkClass}>Development</button>
              <button onClick={() => scrollTo('system')} className={sectionLinkClass}>System</button>
              <button onClick={() => scrollTo('rules')} className={sectionLinkClass}>Rules</button>
              <button onClick={() => scrollTo('recruiting')} className={sectionLinkClass}>Recruiting</button>
              <button onClick={() => scrollTo('residence')} className={sectionLinkClass}>Residence</button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleLanguage} className={`px-3 py-1.5 rounded-lg text-xs tracking-wider uppercase transition-all ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
              {language === 'en' ? 'IT' : 'EN'}
            </button>
            <button onClick={toggleTheme} className={`p-2 rounded-lg transition-all ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="pt-20 pb-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">

          {/* Title Section */}
          <section className="text-center mb-16">
            <img src={VB_LOGO_URL} alt="Varese Basketball" className="w-20 h-20 object-contain mx-auto mb-6" />
            <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-black mb-3 ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
              Varese Basketball: The Official Club Manual
            </h1>
            <h2 className={`text-xl sm:text-2xl font-light ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>"Win the Day"</h2>
          </section>

          {/* Table of Contents */}
          <section className="mb-16">
            <h4 className={h4Class}>Table of Contents</h4>
            <div className={`${infoBoxClass} space-y-3`}>
              {[
                { id: 'philosophy', label: 'The PVB Philosophy: Our DNA' },
                { id: 'development', label: 'The Player Development Framework' },
                { id: 'system', label: 'The PVB System: Our On-Court Identity' },
                { id: 'rules', label: 'Professional Standards & Club Rules' },
                { id: 'recruiting', label: 'Contract & Recruiting Concepts' },
                { id: 'residence', label: 'Player Residence: Rules & Regulations' },
              ].map((item, i) => (
                <button key={item.id} onClick={() => scrollTo(item.id)} className={`block text-left w-full font-bold text-sm sm:text-base hover:pl-2 transition-all ${isDark ? 'text-gray-300 hover:text-orange-400' : 'text-gray-700 hover:text-orange-600'}`}>
                  <span className={isDark ? 'text-orange-400' : 'text-orange-600'}>{i + 1}. </span>{item.label}
                </button>
              ))}
            </div>
          </section>

          {/* Section 1: Philosophy */}
          <section id="philosophy" className="mb-16 pt-16 -mt-16">
            <h2 className={h2Class}>1. The PVB Philosophy: Our DNA</h2>
            <p className={pClass}>Welcome to Varese Basketball.</p>
            <p className={pClass}>Before you read another word, you must understand our purpose. If you believe our goal is to win the next game, to make the national finals, or to collect youth championships, you are mistaken. Those are small ambitions, and we are not in the business of small ambitions.</p>
            <p className={pClass}>Our ultimate, all-consuming goal is to become the <strong className={strongClass}>best basketball development program in Europe.</strong></p>
            <p className={pClass}>This is the standard that fuels us. This is the vision that guides every practice, every drill, and every decision we make. We are not building teams to win temporary trophies; we are forging elite athletes and exceptional young men who are prepared to dominate at the highest levels.</p>
            <p className={pClass}>Everything else—the championships, the professional contracts, the national team selections, the players who reach the NBA—is a consequence. They are the natural results of our relentless pursuit of being the best. This manual is our covenant. It is the blueprint for that pursuit. It sets the tone for our program, and it demands a commitment not just to the work, but to the vision. Read it, understand it, and live it. Because here, we don't just play basketball. We build the future of it.</p>

            <h3 className={h4Class}>Our Core Values</h3>
            <p className={pClass}>These five values are the bedrock of our club. They guide every decision, every practice, and every interaction.</p>
            <ol className={olClass}>
              <li><strong className={strongClass}>Work Ethic:</strong> We are defined by our effort. We embrace hard work when no one is watching.</li>
              <li><strong className={strongClass}>Respect the Game:</strong> We honor the sport by playing it the right way, with intelligence and passion.</li>
              <li><strong className={strongClass}>Respect for Others:</strong> We treat teammates, opponents, coaches, officials, and staff with the highest level of respect.</li>
              <li><strong className={strongClass}>Ambition:</strong> We are obsessed with improvement. We have a relentless desire to be the best version of ourselves.</li>
              <li><strong className={strongClass}>Have Fun:</strong> We cultivate a deep love for the game, fueled by the joy of competition and shared success.</li>
            </ol>

            <h3 className={h4Class}>Our Definition of Success</h3>
            <p className={pClass}>Winning is not our primary goal; it is the <strong className={strongClass}>consequence</strong> of our work. We measure our success by our ability to achieve three key objectives:</p>
            <ul className={ulClass}>
              <li><strong className={strongClass}>Talent Identification:</strong> Finding players with the potential and character to thrive in our system.</li>
              <li><strong className={strongClass}>Talent Development:</strong> Maximizing the potential of every player through our structured program.</li>
              <li><strong className={strongClass}>Talent Creation:</strong> Producing skilled, intelligent, and resilient basketball players who are prepared for the next level.</li>
            </ul>
            <p className={pClass}>The ultimate metric of our success is how much our players improve over the course of the year.</p>
          </section>

          {/* Section 2: Development */}
          <section id="development" className="mb-16 pt-16 -mt-16">
            <h2 className={h2Class}>2. The Player Development Framework</h2>
            <p className={pClass}>Player development is our number one priority. In VB, we believe in an integrated approach, developing the <strong className={strongClass}>Technical</strong>, <strong className={strongClass}>Physical</strong>, and <strong className={strongClass}>Basketball IQ</strong> components of each player. <strong className={strongClass}>Individual practices and skill development are always more important than team practices, games, and results.</strong></p>

            <h3 className={h3Class}>2.1 The Physical Pillar: Building Elite Athletes</h3>
            <p className={pClass}>Our approach to physical development is built on a deep, analytical understanding of what makes a basketball player elite. We evaluate players across two proprietary, data-driven models: the <strong className={strongClass}>Anthropometric Potential Score (APS)</strong>, which assesses a player's physical frame, and the <strong className={strongClass}>Composite Athleticism Score (CAS)</strong>, which measures their functional, on-court athleticism.</p>

            <p className={`${pClass} font-bold`}>The Anthropometric Potential Score (APS): A Player's Physical Blueprint</p>
            <p className={pClass}>A player's physical structure is the architectural blueprint that defines their potential. The APS is a position-adjusted composite score that quantifies this foundation. It moves beyond simple height to prioritize functional length and size, which are far more predictive of on-court success.</p>
            <ul className={ulClass}>
              <li><strong className={strongClass}>Standing Reach (40% Weight):</strong> The most critical metric. It measures a player's ability to control the vertical space around the rim, impacting rim protection, rebounding, and finishing efficiency.</li>
              <li><strong className={strongClass}>Wingspan (30% Weight):</strong> The primary determinant of defensive versatility and the ability to disrupt passing lanes. A long wingspan allows a player to "play bigger" than their height.</li>
              <li><strong className={strongClass}>Height (15% Weight):</strong> A foundational trait that provides a baseline measure of a player's overall scale.</li>
              <li><strong className={strongClass}>Weight (15% Weight):</strong> Essential for physicality and durability, providing a measure of a player's substance and presence.</li>
            </ul>
            <p className={pClass}>Each player's measurements are converted to a position-specific z-score (comparing them to elite NBA prospect benchmarks) and then combined using the weights above. A positive APS indicates an advantageous physical frame for their position, while a negative score highlights a potential physical limitation.</p>

            <p className={`${pClass} font-bold`}>The Composite Athleticism Score (CAS): Measuring On-Court Dynamism</p>
            <p className={pClass}>The CAS is a five-test battery designed to measure the core athletic qualities that translate directly to game situations: explosive power, speed, agility, and functional strength. This score tells us how effectively a player can use their physical frame.</p>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm">
                <thead><tr><th className={thClass}>Test Component</th><th className={thClass}>Primary Quality Measured</th><th className={thClass}>On-Court Relevance</th></tr></thead>
                <tbody>
                  <tr><td className={tdClass(false)}><strong className={strongClass}>Max Vertical Leap</strong></td><td className={tdClass(false)}>Dynamic Explosive Power</td><td className={tdClass(false)}>Finishing dunks, chase-down blocks, catching lobs. The ultimate measure of "in-game" leaping.</td></tr>
                  <tr><td className={tdClass(true)}><strong className={strongClass}>Shuttle Run</strong></td><td className={tdClass(true)}>Agility / Change of Direction</td><td className={tdClass(true)}>Perimeter defense, making sharp offensive cuts, navigating screens. Crucial for defensive versatility.</td></tr>
                  <tr><td className={tdClass(false)}><strong className={strongClass}>Three-Quarter Sprint</strong></td><td className={tdClass(false)}>Linear Speed / Acceleration</td><td className={tdClass(false)}>Transition offense and defense. Measures a player's end-to-end speed.</td></tr>
                  <tr><td className={tdClass(true)}><strong className={strongClass}>Standing Vertical Leap</strong></td><td className={tdClass(true)}>Static Explosive Power</td><td className={tdClass(true)}>Rebounding in a crowd, contesting shots under the basket, rising for a jump shot in a tight space.</td></tr>
                  <tr><td className={tdClass(false)}><strong className={strongClass}>Hex Bar Deadlift (Relative)</strong></td><td className={tdClass(false)}>Foundational Strength</td><td className={tdClass(false)}>The bedrock of all athletic actions. Higher strength improves power, speed, and injury resilience.</td></tr>
                </tbody>
              </table>
            </div>
            <p className={pClass}>Like the APS, all CAS test results are converted into a single, position-adjusted score. This allows us to create a detailed athletic profile for each player, identifying their specific strengths (e.g., "Power Jumper," "Defensive Specialist") and guiding their individual training programs.</p>

            <h3 className={h3Class}>2.2 The Technical & IQ Pillar: Mastering the Game</h3>
            <p className={pClass}>We split our on-court skill development into four interconnected areas.</p>

            <h4 className={h5Class}>Shooting: The Modern Prerequisite</h4>
            <p className={pClass}><em className={emOrangeClass}>"If you can't shoot, you can't play."</em> This is the most critical part of modern player development. Our goal is to foster consistent, efficient, and adaptable shooters across all age groups. We use a leveled system to provide personalized training based on a deep understanding of shooting mechanics.</p>

            <h4 className={h5Class}>The Four Phases of the Shot</h4>
            <p className={pClass}>Every consistent shot can be broken down into four fundamental phases:</p>
            <ol className={olClass}>
              <li><strong className={strongClass}>The Catch:</strong> Establishing initial body and hand position.</li>
              <li><strong className={strongClass}>The Dip:</strong> Transitioning into the power generation phase.</li>
              <li><strong className={strongClass}>The Flow:</strong> Generating upward momentum and shot trajectory.</li>
              <li><strong className={strongClass}>The Follow-Through:</strong> Ensuring accuracy and ball rotation.</li>
            </ol>

            <p className={`${pClass} font-bold`}>A. The Catch</p>
            <p className={pClass}>This phase focuses on preparing the body and hands to initiate the shot. Proper footwork is essential:</p>
            <ul className={ulClass}>
              <li><strong className={strongClass}>The 3-Step Gather ("Walk Up the Shot"):</strong> For developing shooters, we emphasize a "right-left-right" gather (for a right-handed shooter). This sequence involves a forward momentum from approximately 1.5 to 2 meters outside the three-point line, allowing players to generate significant power.</li>
              <li><strong className={strongClass}>Body Positioning:</strong> The body should be square to the basket, with the shooting-side foot positioned approximately half a foot ahead of the non-shooting foot. Knees should be shoulder-width apart. The ball is ideally caught as the non-shooting foot lands.</li>
              <li><strong className={strongClass}>Hand Position:</strong> The shooting wrist must be loaded (flexed back) upon receiving the ball, ready to propel the shot.</li>
              <li><strong className={strongClass}>Avoid Jumping into the Shot:</strong> Jumping <em className={emOrangeClass}>into</em> the catch can dissipate energy and hinder the creation of upward and forward momentum.</li>
            </ul>

            <p className={`${pClass} font-bold`}>B. The Dip</p>
            <p className={pClass}>Following the catch, the shooter transitions into the "Starting Position."</p>
            <ul className={ulClass}>
              <li><strong className={strongClass}>Action:</strong> After catching the ball on the non-shooting foot (e.g., left step), the shooter should dip the ball while simultaneously stepping onto the shooting-side foot (e.g., right step). This combined movement defines the "Dip."</li>
              <li><strong className={strongClass}>Starting Position:</strong> This is a relaxed, athletic stance: face up, eyes on the target, shoulders square, ball at hip height with wrist loaded, and a slight bend in the knees and hips.</li>
              <li><strong className={strongClass}>Avoid:</strong> Holding the ball too high or not dipping, holding it too close to the body, or being overly squatted. These common errors restrict natural power transfer.</li>
            </ul>

            <p className={`${pClass} font-bold`}>C. The Flow</p>
            <p className={pClass}>The "Flow" is the continuous, upward motion that generates the shot.</p>
            <ul className={ulClass}>
              <li><strong className={strongClass}>Initiation:</strong> From the "Starting Position," the body initiates a quick, controlled "down and up" movement. This leverages the stretch reflex for maximum power generation.</li>
              <li><strong className={strongClass}>Ball Path:</strong> The ball moves seamlessly with the <em className={emOrangeClass}>upward</em> momentum in a straight line, passing in front of the face and extending to the shooting point above the head.</li>
              <li><strong className={strongClass}>Execution:</strong> The movement must be fluid and coordinated, with the ball released at the absolute peak of the upward extension.</li>
            </ul>

            <p className={`${pClass} font-bold`}>D. The Follow-Through</p>
            <p className={pClass}>The "Follow-Through" ensures precision and imparts crucial spin on the ball.</p>
            <ul className={ulClass}>
              <li><strong className={strongClass}>Action:</strong> The shooting wrist "snaps through" the ball, with the fingertips (especially index and middle) being the last contact point. This creates backspin for a softer touch.</li>
              <li><strong className={strongClass}>Visual:</strong> The hand should finish in a "swan neck" or "reaching into the cookie jar" position, pointing directly at the basket.</li>
            </ul>

            <h4 className={h5Class}>Assessment and Player Development Levels</h4>
            <p className={pClass}>Our program employs a structured assessment to guide individual player development. Good form is crucial, but our priority is to optimize performance.</p>
            <div className={infoBoxClass}>
              <strong className={strongClass}>Practice vs. Game Performance:</strong> All percentages and levels are based on controlled, high-repetition practice sessions. A player's in-game shooting percentage is typically about half of their practice percentage (e.g., 60% in drills equals ~30% in a game).
            </div>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm">
                <thead><tr><th className={thClass}>Level</th><th className={thClass}>Title</th><th className={thClass}>Threshold (Spot-Up 3s)</th><th className={thClass}>Training Focus</th></tr></thead>
                <tbody>
                  <tr><td className={tdClass(false)}>1</td><td className={tdClass(false)}><strong className={strongClass}>Bad Shooter</strong></td><td className={tdClass(false)}>&lt;50%</td><td className={tdClass(false)}>Work <strong className={strongClass}>only on form</strong> until a respectable mechanic is achieved. Avoid shooting in games.</td></tr>
                  <tr><td className={tdClass(true)}>2</td><td className={tdClass(true)}><strong className={strongClass}>Incapable</strong></td><td className={tdClass(true)}>50-60%</td><td className={tdClass(true)}>Focus on improving form and consistency from spot-up positions. High volume in games should be avoided.</td></tr>
                  <tr><td className={tdClass(false)}>3</td><td className={tdClass(false)}><strong className={strongClass}>Capable</strong></td><td className={tdClass(false)}>60-65%</td><td className={tdClass(false)}>Balance spot-up shots (~60%) with basic movement shots (~40%). Can shoot effectively in games.</td></tr>
                  <tr><td className={tdClass(true)}>4</td><td className={tdClass(true)}><strong className={strongClass}>Volume Shooter</strong></td><td className={tdClass(true)}>65-70%</td><td className={tdClass(true)}>Actively sought for scoring. Training is 40-50% spot-ups and 50-60% intermediate movement shots.</td></tr>
                  <tr><td className={tdClass(false)}>5</td><td className={tdClass(false)}><strong className={strongClass}>Elite Shooter</strong></td><td className={tdClass(false)}>70%+</td><td className={tdClass(false)}>High volume in games. Training is ~25% spot-ups and 75% advanced movement shots and playmaking.</td></tr>
                </tbody>
              </table>
            </div>

            <h4 className={h5Class}>Practice Shooting Principles & Methodology</h4>
            <p className={pClass}>Our practice methodology breaks down shooting into progressive stages, building skills layer by layer.</p>
            <div className={infoBoxClass}>
              <strong className={strongClass}>Core Concept (The "Golf Analogy"):</strong> The legs are the "clubs," and the upper body is the "swing." The swing should remain identical regardless of distance, while the club (leg drive) adjusts for power.
            </div>
            <p className={`${pClass} font-bold`}>A. Form Shooting (Progressive Steps):</p>
            <ol className={olClass}>
              <li><strong className={strongClass}>Step 1 (Restricted Circle):</strong> Upper body mechanics only (Starting Position, Flow, Follow-Through).</li>
              <li><strong className={strongClass}>Step 2 (Mid-Range):</strong> Add ankle extension for power.</li>
              <li><strong className={strongClass}>Step 3 (Free-Throw Line):</strong> Add the "Down and Up" body movement.</li>
              <li><strong className={strongClass}>Step 4 (Long Two-Point):</strong> Add the "Walk Up the Shot" gather and a small jump.</li>
              <li><strong className={strongClass}>Step 5 (Three-Point Line):</strong> Combine all elements for a full, powerful shot.</li>
            </ol>
            <p className={pClass}><strong className={strongClass}>B. Spot-Up Shots:</strong> Focus on high pace and rhythm. Players should move actively between shots. "Train like a pro."</p>
            <p className={pClass}><strong className={strongClass}>C. Basic Movement Shots (Relocation):</strong> Drills focus on fundamental movements to get open (e.g., Mash Out, Slide to Corner, Replace).</p>
            <p className={pClass}><strong className={strongClass}>D. Intermediate Movement Shots (On-Ball Actions):</strong> More complex movements, often with the ball or off screens (e.g., DHO series, Korver Cut, Spain PnR).</p>
            <p className={pClass}><strong className={strongClass}>E. Advanced Movement Shots (Playmaking):</strong> Self-created shots, often off the dribble (e.g., PnR Handler, Step Back, Doncic Gather).</p>

            <h4 className={h5Class}>Expectations and Development Standards (15-year-old prospect)</h4>
            <ul className={ulClass}>
              <li><strong className={strongClass}>Form Development:</strong> Achieve 50% spot-up proficiency within ~2 months of daily form work.</li>
              <li><strong className={strongClass}>Level 2 to 3:</strong> Progress from 50% to 60% within 4 months.</li>
              <li><strong className={strongClass}>Level 3 to 4:</strong> Progress from 60% to 65% within 4 months.</li>
              <li><strong className={strongClass}>Level 4 to 5:</strong> Progress from 65% to 70%+ within one year.</li>
            </ul>
            <div className={infoBoxClass}>
              <strong className={strongClass}>Accountability:</strong> These standards ensure all aspiring elite players reach at least Level 3 proficiency within one year. Failure to meet these benchmarks requires a review of coaching methods and player plans.
            </div>

            <h4 className={h5Class}>Playmaking: Creating Advantages</h4>
            <p className={pClass}>The ability to get by a defender and create for the team.</p>
            <ul className={ulClass}>
              <li><strong className={strongClass}>Ball Handling:</strong> Vitamin sessions begin with focused ball handling. Coaches must plan tailor-made routines with high attention to detail.</li>
              <li><strong className={strongClass}>Passing:</strong> Putting the ball on target. We work daily on specific passes: open step, pocket pass, high pocket, side kick, hook to the corner, baseline hook, and late dump-off.</li>
            </ul>

            <h4 className={h5Class}>Finishing: Scoring at the Rim</h4>
            <p className={pClass}>To be a pro, you must be able to finish. We work on a variety of finishes in different game situations (Rip & Go, DHO, PnR, Transition).</p>
            <ul className={ulClass}>
              <li><strong className={strongClass}>Finishes include:</strong> Euro step, other side of the rim, spins, finishing through contact, big shoulder, between 1-2 defenders, jump stops, and various combinations.</li>
            </ul>

            <h4 className={h5Class}>Basketball IQ: The Deciding Factor</h4>
            <p className={pClass}>Achieved primarily through individual film study.</p>
            <ul className={ulClass}>
              <li><strong className={strongClass}>Game Sense:</strong> Identifying a good play versus a bad play.</li>
              <li><strong className={strongClass}>Shooting Spectrum:</strong> Understanding a good shot versus a bad shot for you and the team.</li>
              <li><strong className={strongClass}>Defense:</strong> Reading offenses, understanding rotations.</li>
              <li><strong className={strongClass}>Court Vision:</strong> Finding the open man.</li>
              <li><strong className={strongClass}>Balance:</strong> Knowing when to expand your game and when to play to your strengths.</li>
            </ul>

            <h3 className={h3Class}>2.3 Workload Management & Tracking</h3>
            <p className={pClass}><strong className={strongClass}>Technical Workload Tracking (Vitamins)</strong>: Coaches are responsible for tracking load daily and customizing workouts.</p>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm">
                <thead><tr><th className={thClass}>Load Level</th><th className={thClass}>Description</th><th className={thClass}>Target</th></tr></thead>
                <tbody>
                  <tr><td className={tdClass(false)}><strong className={strongClass}>Vitamins 1</strong></td><td className={tdClass(false)}>Light spot-up or movement shooting (20-25 min). Ideal for game day or off day.</td><td className={tdClass(false)} rowSpan={3} style={{ verticalAlign: 'middle' }}>Elite players are expected to complete a weekly load between <strong className={strongClass}>8 and 12</strong>.<br/>This equals a monthly load between <strong className={strongClass}>32 and 48</strong>.</td></tr>
                  <tr><td className={tdClass(true)}><strong className={strongClass}>Vitamins 2</strong></td><td className={tdClass(true)}>Regular vitamin (approx. 30 min). Player breaks a good sweat, finishes tired but ready for team practice.</td></tr>
                  <tr><td className={tdClass(false)}><strong className={strongClass}>Vitamins 3</strong></td><td className={tdClass(false)}>"Day Off Vitamin." Longer, more intense version of Vitamin 2. Player should finish very tired.</td></tr>
                </tbody>
              </table>
            </div>
            <p className={pClass}><strong className={strongClass}>Vitamins Keys:</strong></p>
            <ul className={ulClass}>
              <li><strong className={strongClass}>Intensity:</strong> Push players. Train like a pro.</li>
              <li><strong className={strongClass}>Reps:</strong> Rebound for players. Keep the flow up and get reps in.</li>
              <li><strong className={strongClass}>Quality:</strong> Teach high-level execution. Use defense to present realistic situations. Do things that work in the game.</li>
            </ul>

            <p className={pClass}><strong className={strongClass}>Game Load Tracking</strong>: The game is a crucial part of development. We track game load to ensure our players get the right amount of experience.</p>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm">
                <thead><tr><th className={thClass}>Load</th><th className={thClass}>Minutes Played</th><th className={thClass}>Points</th></tr></thead>
                <tbody>
                  <tr><td className={tdClass(false)}>Game 1</td><td className={tdClass(false)}>0-10 minutes</td><td className={tdClass(false)}>1</td></tr>
                  <tr><td className={tdClass(true)}>Game 2</td><td className={tdClass(true)}>11-20 minutes</td><td className={tdClass(true)}>2</td></tr>
                  <tr><td className={tdClass(false)}>Game 3</td><td className={tdClass(false)}>21-30 minutes</td><td className={tdClass(false)}>3</td></tr>
                  <tr><td className={tdClass(true)}>Game 4</td><td className={tdClass(true)}>&gt;30 minutes</td><td className={tdClass(true)}>4</td></tr>
                </tbody>
              </table>
            </div>

            <p className={pClass}><strong className={strongClass}>Practice Load Tracking</strong>: Team practices are tracked to monitor collective work.</p>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm">
                <thead><tr><th className={thClass}>Load</th><th className={thClass}>Description</th><th className={thClass}>Points</th></tr></thead>
                <tbody>
                  <tr><td className={tdClass(false)}>Practice 1</td><td className={tdClass(false)}>Light shootaround practice.</td><td className={tdClass(false)}>1</td></tr>
                  <tr><td className={tdClass(true)}>Practice 2</td><td className={tdClass(true)}>Regular team practice.</td><td className={tdClass(true)}>2</td></tr>
                  <tr><td className={tdClass(false)}>Practice 3</td><td className={tdClass(false)}>Hard, longer pre-season practice.</td><td className={tdClass(false)}>3</td></tr>
                </tbody>
              </table>
            </div>

            <p className={pClass}><strong className={strongClass}>Monthly Load Goals & Overall Balance</strong>: We track workload across four key areas to ensure a balanced development plan.</p>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm">
                <thead><tr><th className={thClass}>Category</th><th className={thClass}>Monthly Load Goal</th></tr></thead>
                <tbody>
                  <tr><td className={tdClass(false)}>Weights Load</td><td className={tdClass(false)}>32 - 48 points</td></tr>
                  <tr><td className={tdClass(true)}>Vitamins Load</td><td className={tdClass(true)}>32 - 48 points</td></tr>
                  <tr><td className={tdClass(false)}>Practice Load</td><td className={tdClass(false)}>16 - 32 points</td></tr>
                  <tr><td className={tdClass(true)}>Game Load</td><td className={tdClass(true)}>24 - 28 points</td></tr>
                  <tr><td className={`${tdClass(false)} font-bold`}><strong className={strongClass}>TOTAL LOAD</strong></td><td className={`${tdClass(false)} font-bold`}><strong className={strongClass}>104 - 146 points</strong></td></tr>
                </tbody>
              </table>
            </div>
            <p className={pClass}><em className={emOrangeClass}>A special note on load:</em> While it is sometimes impossible to be perfectly in range in all areas due to game schedules, travel, or recovery needs, we aim for the <strong className={strongClass}>overall balance</strong>. Coaches must manage the total load to keep players within the target range of 104-146 points per month, adjusting practice and vitamin intensity as needed.</p>

            <h3 className={h3Class}>2.4 The Player Pack: A Tailor-Made Path to Success</h3>
            <p className={pClass}>Tailoring our programs is fundamental to our success. To do this, we create a clear and unique path for each player based on their specific needs. This is achieved through the <strong className={strongClass}>Player Pack</strong>.</p>
            <p className={pClass}>The Player Pack is a comprehensive report that consists of three areas:</p>
            <ol className={olClass}>
              <li><strong className={strongClass}>Physical Profile:</strong> All anthropometric and performance testing data, including the APS and CAS.</li>
              <li><strong className={strongClass}>Player Development Tracking:</strong> All "Vitamin" and "Weights" data, including shooting percentages, drills completed, and loads managed.</li>
              <li><strong className={strongClass}>Game Stats:</strong> Traditional and advanced statistics from all official games.</li>
            </ol>
            <p className={pClass}><strong className={strongClass}>Process and Accountability:</strong></p>
            <ul className={ulClass}>
              <li><strong className={strongClass}>Points of Emphasis (POEs):</strong> Based on the Player Pack data, each player will be assigned <strong className={strongClass}>3 or 4 key points of emphasis</strong> for the month. These are the specific areas coaches must aim to improve.</li>
              <li><strong className={strongClass}>KPIs:</strong> For each POE, a measurable Key Performance Indicator (KPI) will be created to track progress objectively.</li>
              <li><strong className={strongClass}>Coach Rotation:</strong> To provide fresh perspectives and prevent players from becoming accustomed to one style, the designated "Vitamin" coach for each player will <strong className={strongClass}>rotate monthly</strong>.</li>
              <li><strong className={strongClass}>Monthly Evaluation:</strong> Upon rotation, the incoming and outgoing coaches will meet to evaluate the player's evolution based on their KPIs. This meeting will determine the new POEs and any necessary adjustments for the upcoming month.</li>
            </ul>
            <p className={pClass}>Below is an example of a Player Pack report:</p>

            {/* Player Pack Card */}
            <div className={`${cardClass} p-6 sm:p-8`}>
              <div className="relative">
                <img src="https://i.imgur.com/jComki8.png" alt="Varese Logo" className="absolute top-0 right-0 w-12 opacity-30" />
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-6">
                  <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-orange-500 flex-shrink-0">
                    <img src="https://i.imgur.com/n0T2e1Y.jpg" alt="Ivan Prato" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-center sm:text-left">
                    <h4 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>Ivan Prato</h4>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Center / Power Forward | Age: 19</p>
                    <div className="grid grid-cols-4 gap-4 mt-4">
                      {[{ v: '209', u: 'cm', l: 'Height' }, { v: '105', u: 'kg', l: 'Weight' }, { v: '215', u: 'cm', l: 'Wingspan' }, { v: '277', u: 'cm', l: 'Reach' }].map(s => (
                        <div key={s.l} className="text-center">
                          <p className={`text-2xl font-black ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>{s.v}<span className="text-xs">{s.u}</span></p>
                          <p className={`text-xs uppercase ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{s.l}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                  {[
                    { t: 'Player Mirror', v: 'Nicola Mirotic' },
                    { t: 'Projection', v: 'Euroleague' },
                    { t: 'Shooting Level', v: '4 / 5' },
                    { t: 'Athleticism', v: '4 / 5' },
                    { t: 'Game IQ', v: '2 / 5' },
                  ].map(e => (
                    <div key={e.t} className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{e.t}</p>
                      <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{e.v}</p>
                    </div>
                  ))}
                </div>

                <div className={`border-t pt-4 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h5 className={`text-base font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Points of Emphasis</h5>
                  <div className="space-y-2 text-sm">
                    <p className={isDark ? 'text-gray-300' : 'text-gray-600'}><strong className={strongClass}>1. Lateral Quickness:</strong> Crucial for defending PnR coverages. <span className="text-red-500 font-bold">KPI: Reduce Cone Drill time by 5%.</span></p>
                    <p className={isDark ? 'text-gray-300' : 'text-gray-600'}><strong className={strongClass}>2. Explosive Power:</strong> Enhance finishing in traffic and rebounding. <span className="text-green-500 font-bold">KPI: Increase No Step Vertical by 10%.</span></p>
                    <p className={isDark ? 'text-gray-300' : 'text-gray-600'}><strong className={strongClass}>3. Shooting Range:</strong> Extending range is non-negotiable. <span className="text-red-500 font-bold">KPI: &gt;35% 3PT & &gt;70% FT in games.</span></p>
                    <p className={isDark ? 'text-gray-300' : 'text-gray-600'}><strong className={strongClass}>4. Decision Making:</strong> Improve passing vision from post/elbow. <span className="text-red-500 font-bold">KPI: Improve A/TO Ratio to &gt;1.25.</span></p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: System */}
          <section id="system" className="mb-16 pt-16 -mt-16">
            <h2 className={h2Class}>3. The PVB System: Our On-Court Identity</h2>
            <p className={pClass}>This section defines our unified approach to the game. It is the tactical blueprint for every team that represents Varese Basketball.</p>

            <h3 className={h3Class}>3.1 The Shooting Spectrum</h3>
            <p className={pClass}>We always talk about taking "good shots." This is not a matter of opinion; it is a matter of mathematics. The "Shooting Spectrum" is our guide to shot selection, based on the average Points Per Shot (PPS) for each type of attempt. We hunt for the highest value shots.</p>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm">
                <thead><tr><th className={thClass}>Priority</th><th className={thClass}>Shot Type</th><th className={thClass}>Target</th><th className={thClass}>Why</th></tr></thead>
                <tbody>
                  <tr><td className={tdClass(false)}>1</td><td className={tdClass(false)}>Rim Shots</td><td className={tdClass(false)}><span className="text-green-500 font-bold">Highest</span></td><td className={tdClass(false)}>Highest efficiency (66%+). Attack the paint relentlessly.</td></tr>
                  <tr><td className={tdClass(true)}>2</td><td className={tdClass(true)}>Open 3-Pointers</td><td className={tdClass(true)}><span className="text-green-500 font-bold">High</span></td><td className={tdClass(true)}>High expected value (1.08+). Cornerstone of modern offense.</td></tr>
                  <tr><td className={tdClass(false)}>3</td><td className={tdClass(false)}>Free Throws</td><td className={tdClass(false)}><span className="text-green-500 font-bold">High</span></td><td className={tdClass(false)}>"Free" points at 75%+. Aggressive play draws fouls.</td></tr>
                  <tr><td className={tdClass(true)}>4</td><td className={tdClass(true)}>Mid-Range (Pull-Up)</td><td className={tdClass(true)}>Selective</td><td className={tdClass(true)}>Lower efficiency but necessary for elite scorers.</td></tr>
                  <tr><td className={tdClass(false)}>5</td><td className={tdClass(false)}>Contested 3-Pointers</td><td className={tdClass(false)}><span className="text-red-500 font-bold">Avoid</span></td><td className={tdClass(false)}>Low percentage, high variance.</td></tr>
                  <tr><td className={tdClass(true)}>6</td><td className={tdClass(true)}>Long Two-Pointers</td><td className={tdClass(true)}><span className="text-red-500 font-bold">Eliminate</span></td><td className={tdClass(true)}>Worst shot in basketball. Low efficiency, no extra value.</td></tr>
                </tbody>
              </table>
            </div>

            <h3 className={h3Class}>3.2 Transition: Our Primary Weapon</h3>
            <p className={pClass}>We want to play <strong className={strongClass}>fast</strong>. A high pace is not about chaos; it is about creating tactical advantages. Pushing the ball relentlessly forces defenses into uncomfortable situations, which leads to higher-quality shots for us.</p>
            <p className={pClass}>Transition principles:</p>
            <ol className={olClass}>
              <li>Push the ball immediately after every rebound and turnover.</li>
              <li>Fill the lanes wide—we want numbers and spacing in transition.</li>
              <li>The first look is always a layup or dunk at the rim.</li>
              <li>The second look is a kick-out to an open three-pointer.</li>
              <li>If neither is available, get into our half-court offense quickly—no wasted possessions.</li>
            </ol>

            <h3 className={h3Class}>3.3 Half-Court Offense: Flow & Ball Movement</h3>
            <p className={pClass}>When transition is not available, we play with <strong className={strongClass}>flow</strong>. The "0.5 Second" Rule: When you catch the ball, you have half a second to make a decision. Catch, face, and either shoot, drive, or move the ball. No holding, no pump fakes (unless necessary), no jab steps.</p>
            <p className={pClass}>Key half-court principles:</p>
            <ol className={olClass}>
              <li>Ball movement creates open shots—move the ball faster than the defense can rotate.</li>
              <li>Spacing is non-negotiable. Maintain proper floor balance at all times.</li>
              <li>Screen actions (PnR, DHO, pin-downs) are our primary tools to create advantages.</li>
              <li>Read the defense—our offense is read-and-react, not robotic set plays.</li>
              <li>Cut with purpose. Every movement without the ball should have intention.</li>
            </ol>

            <h3 className={h3Class}>3.4 Defense: The Non-Negotiable</h3>
            <p className={pClass}>Defense is effort. It is the great equalizer. A team with inferior talent can compete against anyone with elite defensive effort. Our defensive identity is built on four priorities:</p>
            <ol className={olClass}>
              <li><strong className={strongClass}>Protect the Rim:</strong> Contest and challenge every shot at the basket.</li>
              <li><strong className={strongClass}>Force Tough Twos:</strong> Push the offense into the mid-range—the least efficient shot on the floor.</li>
              <li><strong className={strongClass}>Contest All Threes:</strong> Close out with discipline. A hand up on every three-point attempt.</li>
              <li><strong className={strongClass}>Rebound:</strong> Finish every defensive possession with a rebound. No second-chance points.</li>
            </ol>

            {/* Charts Section */}
            <div className={`${cardClass} p-6 my-8`}>
              <h4 className={`text-lg font-bold mb-6 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>NBA Trends: Data Supporting Our Philosophy</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Three-Point Trend */}
                <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                  <h5 className={`text-sm font-bold mb-3 text-center ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>The Three-Point Revolution</h5>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={threePointData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                      <XAxis dataKey="season" tick={axisTickStyle} fontSize={10} />
                      <YAxis yAxisId="left" tick={axisTickStyle} domain={[22, 28]} />
                      <YAxis yAxisId="right" orientation="right" tick={axisTickStyle} domain={[35, 38]} />
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line yAxisId="left" type="monotone" dataKey="attempted" name="3PA" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316' }} />
                      <Line yAxisId="right" type="monotone" dataKey="pct" name="3P%" stroke={isDark ? '#9ca3af' : '#6b7280'} strokeWidth={2} strokeDasharray="5 5" dot={{ fill: isDark ? '#9ca3af' : '#6b7280' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Shot Spectrum */}
                <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                  <h5 className={`text-sm font-bold mb-3 text-center ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Shot Spectrum (eFG%)</h5>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={shotSpectrumData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                      <XAxis dataKey="type" tick={axisTickStyle} fontSize={10} />
                      <YAxis tick={axisTickStyle} domain={[0, 70]} />
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <Bar dataKey="efg" name="eFG%" fill="#f97316" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Efficiency Comparison */}
                <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                  <h5 className={`text-sm font-bold mb-3 text-center ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Efficiency: Transition vs. Half-Court</h5>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={efficiencyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                      <XAxis dataKey="category" tick={axisTickStyle} />
                      <YAxis tick={axisTickStyle} domain={[0, 1.3]} />
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <Bar dataKey="ppp" name="PPP" fill="#f97316" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Post-Up Decline */}
                <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                  <h5 className={`text-sm font-bold mb-3 text-center ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Decline of the Post-Up</h5>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={postUpData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                      <XAxis dataKey="season" tick={axisTickStyle} fontSize={10} />
                      <YAxis tick={axisTickStyle} domain={[0, 12]} />
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <Line type="monotone" dataKey="freq" name="Post-Up %" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Long-Two Decline (full width) */}
                <div className={`p-4 rounded-lg md:col-span-2 ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                  <h5 className={`text-sm font-bold mb-3 text-center ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Decline of the Long-Two</h5>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={longTwoData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                      <XAxis dataKey="season" tick={axisTickStyle} fontSize={10} />
                      <YAxis tick={axisTickStyle} domain={[0, 28]} />
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <Line type="monotone" dataKey="pct" name="Long 2PT %" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <h3 className={h3Class}>3.5 Practice Structure</h3>
            <p className={pClass}>Every practice follows a mandatory, four-part structure designed for maximum efficiency and development.</p>
            <ol className={olClass}>
              <li><strong className={strongClass}>Prevention (15 min):</strong> A standardized pre-workout routine focused on activation and injury prevention.</li>
              <li><strong className={strongClass}>"Vitamins" (60 min):</strong> The most critical part of our day. This is <strong className={strongClass}>individual work</strong>, split between technical skill development (30 min) and physical development (30 min).</li>
              <li><strong className={strongClass}>Team Practice (45 min):</strong> Focused on implementing our team concepts, strategy, and style.</li>
              <li><strong className={strongClass}>Recovery (15 min):</strong> A mandatory cool-down and recovery protocol.</li>
            </ol>

            <h3 className={h3Class}>3.6 On-Court Demands: PVB vs. Non-PVB</h3>
            <p className={pClass}>We have a clear language for what aligns with our philosophy. Coaches must teach and demand <strong className={strongClass}>PVB</strong> actions.</p>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm">
                <thead><tr><th className={thClass}><span className="text-green-500">✔ PVB (Pallacanestro Varese Basketball)</span></th><th className={thClass}><span className="text-red-500">❌ Non-PVB</span></th></tr></thead>
                <tbody>
                  <tr><td className={tdClass(false)}>Playing Fast (Transition & Pace)</td><td className={tdClass(false)}>Playing Slow</td></tr>
                  <tr><td className={tdClass(true)}>Taking Good Shots (Shooting Spectrum)</td><td className={tdClass(true)}>Bad Shots</td></tr>
                  <tr><td className={tdClass(false)}>Ball Movement ("Flow," 0.5 seconds)</td><td className={tdClass(false)}>Pump Fakes, Jab (unless necessary)</td></tr>
                  <tr><td className={tdClass(true)}>Playing Hard (Crash, Deflections, Intangibles)</td><td className={tdClass(true)}>Isolation, Kill the Flow ("ISO")</td></tr>
                  <tr><td className={tdClass(false)}>Constant Effort (Running back on D)</td><td className={tdClass(false)}>No Effort (Not running back, no crash)</td></tr>
                </tbody>
              </table>
            </div>

            <h3 className={h3Class}>3.7 Coach's Philosophy & Evaluation</h3>
            <p className={pClass}><strong className={strongClass}>Guiding Principles</strong>: Every coach at Varese Basketball is expected to embody these principles in every interaction:</p>
            <ul className={ulClass}>
              <li><strong className={strongClass}>Be Transparent:</strong> Communicate openly with players about what we are doing and why we are doing it.</li>
              <li><strong className={strongClass}>Be Honest:</strong> Never lie to players. Build trust through truthfulness, even when the truth is difficult.</li>
              <li><strong className={strongClass}>Be Fair:</strong> Treat every player with equity. Decisions should be based on merit and adherence to our program's values, not favoritism.</li>
            </ul>
            <p className={pClass}><strong className={strongClass}>Focus & Priority</strong>: It is important to understand that Varese Basketball (VB) coaches collaborate with Pallacanestro Varese (PV), helping in vitamins, scouting, or team meetings. However, their primary focus is <strong className={strongClass}>VB</strong>. The majority of a coach's energy, preparation, and thought process must be spent on the development of VB players and teams.</p>
            <p className={pClass}><strong className={strongClass}>Meetings & Accountability</strong></p>
            <ul className={ulClass}>
              <li><strong className={strongClass}>Regular Meetings:</strong> The coaching staff will meet regularly to ensure alignment and monitor progress.</li>
              <li><strong className={strongClass}>Meeting Agenda:</strong> Discussions will focus on two key areas:
                <ol className={`${olClass} mt-2`}>
                  <li>The evolution of players according to their individual "Player Packs."</li>
                  <li>An analysis of how well each team is playing "PVB" basketball, based on our established style and metrics.</li>
                </ol>
              </li>
              <li><strong className={strongClass}>KPIs and Adjustments:</strong> Key Performance Indicators (KPIs) will be established for both individual player development and team style of play. If these KPIs are not being met, coaches are expected to make the necessary adjustments to their training plans and strategies.</li>
            </ul>
            <p className={pClass}><strong className={strongClass}>How We Judge Success</strong>: At the end of the day, coaches are judged on their ability to <strong className={strongClass}>develop players</strong> and <strong className={strongClass}>follow this manual</strong>.</p>
            <p className={pClass}>Wins and losses are not the main focus but the consequence of the work done. A coach may be developing players and executing the program perfectly but not have positive results on the court. For us, that is not a failure. We do not care about youth championships; we care about giving our players the best opportunity to succeed at the next level.</p>
            <p className={pClass}>Conversely, if a coach wins many games but does not develop players or align with our rules and philosophy, the wins will not matter.</p>
            <p className={pClass}>At the end of the year, you will be judged on how well you followed the PVB plan. Ask yourself these questions daily:</p>
            <ul className={ulClass}>
              <li><strong className={strongClass}>Do you coach like PVB?</strong></li>
              <li><strong className={strongClass}>Do you train like PVB?</strong></li>
              <li><strong className={strongClass}>Do you think like PVB?</strong></li>
            </ul>
          </section>

          {/* Section 4: Rules */}
          <section id="rules" className="mb-16 pt-16 -mt-16">
            <h2 className={h2Class}>4. Professional Standards & Club Rules</h2>
            <p className={pClass}>At Varese Basketball, everything is earned. We operate with the highest level of professionalism.</p>

            <h3 className={h3Class}>Communication Policy</h3>
            <ul className={ulClass}>
              <li><strong className={strongClass}>To Players:</strong> Coaches explain what is necessary to the players. We do not promise playing time or roles EVER.</li>
              <li><strong className={strongClass}>To Parents:</strong> We do not explain coaching decisions or playing time to parents. Management will hold official meetings with all parents to explain our program philosophy and what we do.</li>
              <li><strong className={strongClass}>To Media:</strong> Staff and players do not speak with the media, either on the record or off the record.</li>
              <li><strong className={strongClass}>Internal/External:</strong> All communication must be sharp, efficient, and professional.</li>
            </ul>

            <h3 className={h3Class}>Player Rules & Expectations: "Be a Pro"</h3>
            <ol className={olClass}>
              <li><strong className={strongClass}>Be On Time, Always.</strong> If you are on time, you are late. Arrive <em className={emOrangeClass}>before</em> the scheduled practice time. In case of a true emergency, you must inform the staff with as much advance notice as possible.</li>
              <li><strong className={strongClass}>Live Like a Pro.</strong> This extends beyond the court. It means prioritizing sleep, nutrition, film study, recovery, and pre-practice preparation.</li>
              <li><strong className={strongClass}>Wear Varese Basketball Gear.</strong> The official club gear must be worn at ALL times during club events (practices, games, travel, team events). No exceptions.</li>
              <li><strong className={strongClass}>Injury Protocol.</strong> If you are sick or injured, you must still report to practice to be evaluated by the club's medical staff. They will determine if you should go home or remain for treatment. If you are injured, a physical workout or rehab session will be scheduled for you during practice time.</li>
              <li><strong className={strongClass}>No Cell Phones in Work Areas.</strong> To maintain focus and professionalism, cell phones are not permitted in any work area, including the court, weight room, and film room. Keep your phone in your locker or bag.</li>
            </ol>

            <h3 className={h3Class}>Scheduling & Player Management</h3>
            <ul className={ulClass}>
              <li><strong className={strongClass}>Season:</strong> We operate from the first Monday of August until the last Friday of June.</li>
              <li><strong className={strongClass}>Weekly Workload (Elite Players):</strong>
                <ul className={`${ulClass} mt-2`}>
                  <li>Minimum of <strong className={strongClass}>4 "Vitamins"</strong> skill sessions per week.</li>
                  <li>Minimum of <strong className={strongClass}>4 weights sessions</strong> per week.</li>
                  <li>Players will have <strong className={strongClass}>one day off</strong> per week when the schedule allows.</li>
                </ul>
              </li>
              <li><strong className={strongClass}>Playing Time & Progression:</strong>
                <ul className={`${ulClass} mt-2`}>
                  <li>Elite players are expected to play between <strong className={strongClass}>25-35 minutes</strong> in their primary category and <strong className={strongClass}>15-25 minutes</strong> in the category above them.</li>
                  <li><strong className={strongClass}>Players will not play more than 2 games per week.</strong> This means a player cannot be active for 3 different categories.</li>
                  <li>If a player improves so rapidly that he earns a permanent spot at a higher level, he will be moved up and will no longer play in the previous category.</li>
                </ul>
              </li>
            </ul>
          </section>

          {/* Section 5: Recruiting */}
          <section id="recruiting" className="mb-16 pt-16 -mt-16">
            <h2 className={h2Class}>5. Contract & Recruiting Concepts</h2>
            <p className={pClass}>This section outlines our strategic approach to identifying and acquiring talent. Understanding these concepts is crucial to the long-term health and success of our program.</p>

            <h3 className={h3Class}>5.1 Recruiting Philosophy: The Two Approaches</h3>
            <p className={pClass}>We recognize that recruiting a 15-year-old is fundamentally different from recruiting an 18-year-old. Our approach must adapt accordingly.</p>
            <ul className={ulClass}>
              <li>
                <strong className={strongClass}>Recruiting Younger Players (14-16): The Program Pitch</strong>
                <ul className={`${ulClass} mt-2`}>
                  <li><strong className={strongClass}>Focus:</strong> At this age, we are recruiting the family as much as the player. The conversation centers on our environment and development pathway.</li>
                  <li><strong className={strongClass}>Key Selling Points:</strong> The quality of our program, the dedication of our coaches, the structure of the residence, off-court activities, and our commitment to their overall well-being.</li>
                  <li><strong className={strongClass}>Audience:</strong> Parents are the primary decision-makers. Schooling, safety, and social issues are paramount. Contract clauses are secondary to the quality of the experience.</li>
                </ul>
              </li>
              <li>
                <strong className={strongClass}>Recruiting Older Players (17-18): The Professional Pitch</strong>
                <ul className={`${ulClass} mt-2`}>
                  <li><strong className={strongClass}>Focus:</strong> As players mature, the conversation shifts towards their professional future.</li>
                  <li><strong className={strongClass}>Key Selling Points:</strong> Contract details, team options, and the player's specific role become much more relevant.</li>
                  <li><strong className={strongClass}>Audience:</strong> We are more likely to be dealing with agents. The approach is more transactional and focused on the contractual and financial aspects of the offer.</li>
                </ul>
              </li>
            </ul>
            <p className={pClass}>Understanding which conversation to have is crucial for bringing the right talent to Varese.</p>

            <h3 className={h3Class}>5.2 What We Look For: The PVB Potential Matrix</h3>
            <p className={pClass}>When recruiting, especially at younger ages, we prioritize <strong className={strongClass}>potential</strong> over current production. It is very difficult to know what a 15-year-old will become, so we focus on key indicators to maximize our chances of success.</p>
            <ol className={olClass}>
              <li><strong className={strongClass}>Size (The Non-Negotiable):</strong> This is basketball. To be a great player, you need to be tall and long. Height, wingspan, and standing reach—adjusted for age and the size of the player's parents—are the most important physical values.</li>
              <li><strong className={strongClass}>Athleticism:</strong> The ability to move. We look for explosive potential in jumping, lateral quickness, and open-court speed.</li>
              <li><strong className={strongClass}>Work Ethic:</strong> "Work beats talent when talent doesn't work." We look for players who demonstrate a love for the gym and a desire to improve.</li>
              <li><strong className={strongClass}>Talent:</strong> This includes technical skill (shooting, dribbling, passing) but, more importantly, a player's <strong className={strongClass}>ability to learn fast</strong>. A quick learner has the highest ceiling.</li>
              <li><strong className={strongClass}>Personality:</strong> Character matters. Is the player fun to be around? Are they a good teammate? Are they coachable and respectful?</li>
            </ol>

            <h3 className={h3Class}>5.3 Strategic Framework: Rules, Regulations & Roster Management</h3>
            <p className={pClass}><strong className={strongClass}>Navigating the Rules</strong>: The rules of Italian basketball are complex and change often. This is a dynamic topic, but the following are key limitations we must always consider:</p>
            <ul className={ulClass}>
              <li><strong className={strongClass}>4-Year Formation:</strong> To be considered a "homegrown" player, a player must complete four years of formation. A year counts if the player plays in at least 14 official games (a maximum of 4 can be in a secondary category).</li>
              <li><strong className={strongClass}>Import Limit:</strong> Only one non-formation player is allowed per team.</li>
              <li><strong className={strongClass}>Passports & Paperwork:</strong> Visas can be complicated. European passports are extremely valuable.</li>
              <li><strong className={strongClass}>U19 Third Year:</strong> This year has limited value for both the club and the player under current regulations.</li>
              <li><strong className={strongClass}>U23/U26 Benefits:</strong> Only players with Italian passports qualify for certain age-based benefits.</li>
            </ul>
            <p className={pClass}><strong className={strongClass}>Ages & Nationalities Criteria</strong></p>
            <ul className={ulClass}>
              <li><strong className={strongClass}>Imports:</strong> Must either be young enough to complete the 4-year formation period OR be a "no-brainer" talent whose impact transcends age and passport status.</li>
              <li><strong className={strongClass}>Italians/Formatted Players:</strong> Can be older, as they do not face the same formation restrictions.</li>
            </ul>
            <p className={pClass}><strong className={strongClass}>Investment Strategy & Local Talent</strong>: Developing a player in our residence costs approximately €30,000 per year. This is a significant investment that must be made strategically.</p>
            <ul className={ulClass}>
              <li><strong className={strongClass}>Residence players must make a real difference.</strong> If a foreign player does not add noticeable value beyond our local talent, we will prioritize our local players.</li>
              <li>Local players and their families are a vital part of our community. We will not damage these relationships by sidelining a local player for an import of similar ability.</li>
            </ul>

            <h3 className={h3Class}>5.4 Maximizing Roster Configuration</h3>
            <p className={pClass}>Our goal is to develop as many players as possible. This philosophy dictates how we build our teams.</p>
            <ul className={ulClass}>
              <li><strong className={strongClass}>More Teams, More Opportunities:</strong> Our goal is to expand from 6 teams to 9. We value creating more roles (best player, starter, role player) across more teams over consolidating talent to win a youth championship.</li>
              <li><strong className={strongClass}>Short Rosters:</strong> We aim to keep our team rosters short (8-9 players). This guarantees more playing time and creates opportunities to move players up from the category below to challenge them against older competition.</li>
              <li><strong className={strongClass}>Strategic Roster Building:</strong> We must avoid turnover as much as possible. This means spreading our import players strategically across different teams to avoid having to rest players due to the 1-import rule.</li>
            </ul>
            <p className={pClass}><strong className={strongClass}>Tournament Policy</strong></p>
            <ul className={ulClass}>
              <li>We <strong className={strongClass}>NEVER</strong> bring in players from other programs to reinforce our teams for tournaments. Do not attempt this.</li>
              <li>We <strong className={strongClass}>NEVER</strong> allow our players to reinforce other teams in tournaments. Do not attempt this.</li>
              <li><strong className={strongClass}>National Team and other global selections are an exception.</strong> We are proud to support our players who earn these prestigious opportunities.</li>
            </ul>

            <h3 className={h3Class}>5.5 Standard Contract Templates & Commitment</h3>
            <p className={pClass}>We offer structured, long-term pathways for our players. One-year deals and uncommitted players should be avoided. Our goal is to build lasting relationships.</p>
            <p className={pClass}><strong className={strongClass}>The Standard Development Contract</strong>: This is our typical offer for promising young players. It is a 4-year commitment that provides a complete support system.</p>
            <ul className={ulClass}>
              <li><strong className={strongClass}>Includes:</strong> Housing, food, schooling, and shoes, plus "walkaround" money for personal expenses.</li>
              <li><strong className={strongClass}>The Goal:</strong> The contract includes a team option for a professional contract with our Serie A first team upon completion of the development period.</li>
            </ul>
            <p className={pClass}><strong className={strongClass}>The NCAA Pathway</strong>: As an alternative to the direct professional path, we provide comprehensive support for players wishing to pursue opportunities in the NCAA.</p>
            <ul className={ulClass}>
              <li><strong className={strongClass}>Our Support Includes:</strong> Organizing trips to camps, facilitating contact with agents and coaches, and assisting with communication.</li>
              <li><strong className={strongClass}>The Agreement:</strong> In exchange for this support, the club receives a percentage of any NIL (Name, Image, Likeness) earnings and a "first refusal" option for the player's professional contract if they choose to return to Europe.</li>
            </ul>
            <p className={pClass}><strong className={strongClass}>The "Mauro Villa" Concept</strong>: This is a specific strategy for pursuing players who are at the end of their development path (either Italian or foreign players who have already completed the necessary formation years).</p>
            <ul className={ulClass}>
              <li><strong className={strongClass}>The Structure:</strong> We offer a multi-year plan:
                <ol className={`${olClass} mt-2`}>
                  <li>One final season in our Under-19 program.</li>
                  <li>A follow-up year playing with our affiliated Serie B team.</li>
                  <li>A team option for a professional contract with our Serie A team after the Serie B season.</li>
                </ol>
              </li>
            </ul>
            <p className={pClass}><strong className={strongClass}>The Double Commitment</strong>: For a player to succeed at this age, a dual commitment is required.</p>
            <ol className={olClass}>
              <li><strong className={strongClass}>Commitment to Basketball:</strong> The player must be dedicated to maximizing their potential.</li>
              <li><strong className={strongClass}>Commitment to Us:</strong> The player must be fully invested in our program, our philosophy, and our culture.</li>
            </ol>
            <p className={pClass}>Having a player who is not invested in our program is a waste of time and money, even if they provide temporary wins. We are building a culture, not just a team.</p>
          </section>

          {/* Section 6: Residence */}
          <section id="residence" className="mb-16 pt-16 -mt-16">
            <h2 className={h2Class}>6. Player Residence: Rules & Regulations</h2>
            <p className={pClass}>Living together as a team is a privilege that requires maturity and respect. The residence is an extension of our club, and the standards of behavior are the same as on the court. These rules are in place to ensure a clean, safe, and peaceful environment for everyone.</p>

            <h3 className={h3Class}>6.1 Cleanliness and Tidiness</h3>
            <ul className={ulClass}>
              <li>Keep your personal room and all common areas clean at all times.</li>
              <li><strong className={strongClass}>Kitchen Duty:</strong>
                <ul className={`${ulClass} mt-2`}>
                  <li>Load your dishes into the dishwasher in the evening. If the dishwasher is full, you must empty it.</li>
                  <li>Messy kitchen in the morning: <strong className={strongClass}>€5 fine</strong>.</li>
                  <li>Failure to clean the stovetop after use: <strong className={strongClass}>€10 fine</strong>.</li>
                  <li>Food left out after dinner: <strong className={strongClass}>€5 fine</strong>.</li>
                </ul>
              </li>
              <li><strong className={strongClass}>Waste Separation:</strong> Respect the rules for waste separation. Trash in the wrong bin: <strong className={strongClass}>€5 fine</strong>.</li>
              <li><strong className={strongClass}>Personal Space:</strong> Avoid using bathrooms or rooms that have not been assigned to you.</li>
            </ul>

            <h3 className={h3Class}>6.2 Hours and Respect</h3>
            <ul className={ulClass}>
              <li>Respect all established hours for meals, study, and curfew.</li>
              <li><strong className={strongClass}>Quiet Hours:</strong> Maintain silence from <strong className={strongClass}>11:00 PM to 7:00 AM</strong>. Violation of quiet hours: <strong className={strongClass}>€5 fine</strong>.</li>
              <li>Respect all other guests and residence staff. Your conduct reflects on the entire club.</li>
            </ul>

            <h3 className={h3Class}>6.3 Energy and Resources</h3>
            <ul className={ulClass}>
              <li>Turn off lights and devices (heating, TV) when you leave a room. Failure to do so: <strong className={strongClass}>€5 fine</strong>.</li>
              <li>Do not leave the heating on with the windows open. Failure to do so: <strong className={strongClass}>€5 fine</strong>.</li>
              <li>Turn off all lights in common areas before going to bed. Failure to do so: <strong className={strongClass}>€5 fine</strong>.</li>
            </ul>

            <h3 className={h3Class}>6.4 Damages and Guests</h3>
            <ul className={ulClass}>
              <li><strong className={strongClass}>Damages:</strong> Any damages caused to the property will be evaluated on a case-by-case basis and you will be held financially responsible.</li>
              <li><strong className={strongClass}>Guests:</strong> Guests are only allowed with prior permission from the residence staff.</li>
            </ul>

            <h3 className={h3Class}>6.5 Penalties and Enforcement</h3>
            <ul className={ulClass}>
              <li><strong className={strongClass}>Fines:</strong> All fines will be deducted from player accounts at the end of the month. Fines are applied only to those who break the rules, not to the entire group.</li>
              <li><strong className={strongClass}>Repeated Infractions:</strong> Repeated violations of these rules may lead to more serious measures, which will be evaluated individually by club management.</li>
            </ul>
            <p className={pClass}><strong className={strongClass}>A Final Note:</strong> Everyone's cooperation is essential for creating a positive and professional living environment. Treat the residence and your teammates with the same respect you show on the basketball court.</p>
          </section>

          {/* Final Section */}
          <section className="mb-16">
            <h2 className={h2Class}>A Final Word: The 1% Rule</h2>
            <div className={`${infoBoxClass} text-center text-lg`}>
              <p className="mb-2">We don't want you to be perfect. We don't want you to be great. We don't even want you to be good.</p>
              <p className="font-bold">All we want is for you to be 1% better than you were yesterday.</p>
            </div>
            <p className={`text-center text-3xl sm:text-4xl font-black mt-8 ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>WIN THE DAY!</p>
          </section>

        </div>
      </main>
    </div>
  );
};
