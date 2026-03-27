import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import OddsChip from './OddsChip';
import LiveBadge from './LiveBadge';

interface MatchCardProps {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  time?: string;
  league: string;
  isLive?: boolean;
  oddsHome: number;
  oddsDraw: number;
  oddsAway: number;
  boosted?: boolean;
  originalOddsHome?: number;
  originalOddsDraw?: number;
  originalOddsAway?: number;
}

const MatchCard = ({
  id, homeTeam, awayTeam, homeScore, awayScore, time, league, isLive,
  oddsHome, oddsDraw, oddsAway, boosted,
  originalOddsHome, originalOddsDraw, originalOddsAway,
}: MatchCardProps) => {
  const navigate = useNavigate();
  const matchName = `${homeTeam} vs ${awayTeam}`;

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className="bg-surface-card rounded-xl p-4 space-y-3 cursor-pointer" onClick={() => navigate(`/evento/${id}`)} role="button">
      <div className="flex items-center justify-between">
        <span className="text-[0.65rem] font-body text-muted-foreground uppercase tracking-wider">
          {league}
        </span>
        {isLive ? <LiveBadge /> : (
          <span className="text-[0.65rem] font-body text-muted-foreground">{time}</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Match info */}
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-body font-semibold text-sm">{homeTeam}</span>
            {isLive && homeScore !== undefined && (
              <span className="font-display text-lg font-bold text-primary">{homeScore}</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="font-body font-semibold text-sm">{awayTeam}</span>
            {isLive && awayScore !== undefined && (
              <span className="font-display text-lg font-bold text-primary">{awayScore}</span>
            )}
          </div>
        </div>

      </div>

      <div className="flex gap-2">
        <OddsChip
          odds={oddsHome}
          label="1"
          betId={`${id}-home`}
          match={matchName}
          market="Resultado"
          selection={homeTeam}
          boosted={boosted}
          originalOdds={originalOddsHome}
        />
        <OddsChip
          odds={oddsDraw}
          label="X"
          betId={`${id}-draw`}
          match={matchName}
          market="Resultado"
          selection="Empate"
          boosted={boosted}
          originalOdds={originalOddsDraw}
        />
        <OddsChip
          odds={oddsAway}
          label="2"
          betId={`${id}-away`}
          match={matchName}
          market="Resultado"
          selection={awayTeam}
          boosted={boosted}
          originalOdds={originalOddsAway}
        />
      </div>
    </motion.div>
  );
};
export default MatchCard;
