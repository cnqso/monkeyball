import { Player } from '@/types/player';
import { MONKEY_NAMES } from '@/types/player';

interface PlayerDisplayProps {
  player: Player;
  showMonkey?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function PlayerDisplay({ 
  player, 
  showMonkey = false,
  size = 'md',
  className = ''
}: PlayerDisplayProps) {
  const sizeClasses = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-12 w-12 text-base',
    lg: 'h-16 w-16 text-lg'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${sizeClasses[size]} flex-shrink-0`}>
        <img
          src={`/profile-pictures/${player.profile_picture_id}.png`}
          alt={`${player.player_tag}'s profile`}
          className="w-full h-full object-cover rounded-full"
        />
      </div>
      <div>
        <div className="font-semibold">{player.player_tag}</div>
        {showMonkey && (
          <div className="text-sm text-gray-600">
            {MONKEY_NAMES[player.monkey_preference]}
          </div>
        )}
      </div>
    </div>
  );
} 