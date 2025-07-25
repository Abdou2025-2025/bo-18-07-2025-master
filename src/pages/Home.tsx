import { useState, useEffect } from "react";
import { PlayerCard } from "@/components/ui/player-card";
import { EnhancedPlayerCard } from "@/components/ui/enhanced-player-card";
import { LiveScoreWidget, NewsFeed } from "@/components/ui/football-features";
import { SearchAndFilters } from "@/components/ui/search-and-filters";
import { FeatureFlagWrapper } from "@/components/ui/feature-flag-wrapper";
import { PlayerDetailsModal } from "@/components/ui/player-details-modal";
import { NotificationCenter } from "@/components/ui/notification-center";
import { SearchModal } from "@/components/ui/search-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useResponsive } from "@/hooks/useResponsive";
import ballonDorIcon from "@/assets/ballon-dor-icon.png";
import mbappePhoto from "@/assets/player-mbappe.jpg";
import haalandPhoto from "@/assets/player-haaland.jpg";
import bellinghamPhoto from "@/assets/player-bellingham.jpg";
import { Link } from "react-router-dom";
import { fetchPlayerByName } from "@/lib/utils";
import { favoritePlayersNames } from "@/utils/ballonDorPlayers";
import { useSupabaseTable } from "@/hooks/useSupabaseTable";
import { realRankingStatic } from "./Ranking";

// Données de test pour les joueurs favoris
const favoritePlayersData = [
  {
    id: "1",
    slug: "kylian-mbappe",
    name: "Kylian Mbappé",
    position: "Attaquant",
    club: "Real Madrid",
    photo: mbappePhoto,
    votes: 12456,
    isLiked: true
  },
  {
    id: "2",
    slug: "erling-haaland",
    name: "Erling Haaland",
    position: "Attaquant",
    club: "Manchester City",
    photo: haalandPhoto,
    votes: 11234,
    isLiked: false
  },
  {
    id: "3",
    slug: "jude-bellingham",
    name: "Jude Bellingham",
    position: "Milieu",
    club: "Real Madrid",
    photo: bellinghamPhoto,
    votes: 9876,
    isLiked: true
  },
  {
    id: "4",
    slug: "pedri-gonzalez",
    name: "Pedri González",
    position: "Milieu",
    club: "FC Barcelone",
    photo: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=300&fit=crop",
    votes: 8765,
    isLiked: false
  }
];

function getCountdown(targetDate) {
  const now = new Date();
  const diff = Math.max(0, targetDate.getTime() - now.getTime());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds };
}

export default function Home() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [players, setPlayers] = useState<any[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [showPlayerDetails, setShowPlayerDetails] = useState(false);
  const [notificationCount, setNotificationCount] = useState(3);
  const [activeFilter, setActiveFilter] = useState("all");
  const { toast } = useToast();
  const { isMobile, isTablet } = useResponsive();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [supabaseStatus, setSupabaseStatus] = useState<string>("");
  const { data: playersData, loading: loadingPlayers, insert, update } = useSupabaseTable('players');
  const top5Ranking = realRankingStatic.slice(0, 5);

  // Handlers pour le top 5 (pas de like, vote local)
  const [top5Votes, setTop5Votes] = useState<{ [name: string]: number }>({});
  const handleTop5Vote = (playerName: string) => {
    setTop5Votes(v => ({ ...v, [playerName]: (v[playerName] || 0) + 1 }));
  };
  const handleTop5ViewDetails = (player: any) => {
    setSelectedPlayer(player);
    setShowPlayerDetails(true);
  };

  const ceremonyDate = new Date("2025-10-30T20:00:00");
  const [countdown, setCountdown] = useState(getCountdown(ceremonyDate));
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getCountdown(ceremonyDate));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Afficher la modale de compte à rebours au chargement
    const timer = setTimeout(() => {
      // setShowCountdown(true); // This line is removed
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all(favoritePlayersNames.map(name => fetchPlayerByName(name)
      .then(data => data.response?.[0] || null)
      .catch(() => null)
    ))
      .then(apiPlayers => {
        // Fallback sur les données mockées si l'API ne trouve pas le joueur
        const fallbackPlayers = [
          {
            id: "1",
            slug: "kylian-mbappe",
            name: "Kylian Mbappé",
            position: "Attaquant",
            club: "Real Madrid",
            photo: mbappePhoto,
            votes: 12456,
            isLiked: true
          },
          {
            id: "2",
            slug: "erling-haaland",
            name: "Erling Haaland",
            position: "Attaquant",
            club: "Manchester City",
            photo: haalandPhoto,
            votes: 11234,
            isLiked: false
          },
          {
            id: "3",
            slug: "jude-bellingham",
            name: "Jude Bellingham",
            position: "Milieu",
            club: "Real Madrid",
            photo: bellinghamPhoto,
            votes: 9876,
            isLiked: true
          },
          {
            id: "4",
            slug: "pedri-gonzalez",
            name: "Pedri González",
            position: "Milieu",
            club: "FC Barcelone",
            photo: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=300&fit=crop",
            votes: 8765,
            isLiked: false
          }
        ];
        const playersFinal = apiPlayers.map((apiPlayer, i) => {
          if (apiPlayer) {
            return {
              id: apiPlayer.player.id,
              slug: fallbackPlayers[i].slug,
              name: apiPlayer.player.name,
              position: apiPlayer.statistics?.[0]?.games?.position || fallbackPlayers[i].position,
              club: apiPlayer.statistics?.[0]?.team?.name || fallbackPlayers[i].club,
              photo: apiPlayer.player.photo || fallbackPlayers[i].photo,
              votes: fallbackPlayers[i].votes,
              isLiked: fallbackPlayers[i].isLiked,
              stats: apiPlayer.statistics?.[0] || {},
            };
          } else {
            return fallbackPlayers[i];
          }
        });
        setPlayers(playersFinal);
      })
      .catch(() => {
        setError("Erreur lors du chargement des joueurs depuis l'API.");
        setPlayers([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loadingPlayers && players.length === 0) {
      insert(favoritePlayersData);
    }
  }, [loadingPlayers, players.length, insert]);

  useEffect(() => {
    setSupabaseStatus('Using localStorage instead of Supabase');
  }, []);

  const handleViewDetails = (player: any) => {
    setSelectedPlayer(player);
    setShowPlayerDetails(true);
  };

  const handleVote = async (playerId: string) => {
    const player = playersData.find((p: any) => p.id === playerId);
    if (player) {
      await update(playerId, { votes: (player.votes || 0) + 1 });
      toast({
        title: "Vote enregistré !",
        description: `Vous avez voté pour ${player?.name}. Merci pour votre participation !`,
      });
    }
  };

  const handleLike = async (playerId: string) => {
    const player = playersData.find((p: any) => p.id === playerId);
    if (player) {
      await update(playerId, { isLiked: !player.isLiked });
      toast({
        title: !player.isLiked ? "Ajouté aux favoris ❤️" : "Retiré des favoris",
        description: `${player?.name} ${!player.isLiked ? 'ajouté à' : 'retiré de'} votre liste de favoris.`,
      });
    }
  };

  const handleNotificationClick = () => {
    setShowNotifications(true);
    setNotificationCount(0); // Reset notification count when opened
  };

  const handleSearch = (query: string) => {
    console.log("Recherche:", query);
    // TODO: Implémenter la recherche
  };

  const handleFilterChange = (filters: Record<string, any>) => {
    console.log("Filtres:", filters);
    // TODO: Implémenter les filtres
  };

  const filterOptions = {
    position: [
      { id: "gk", label: "Gardien", value: "GK" },
      { id: "def", label: "Défenseur", value: "DEF" },
      { id: "mid", label: "Milieu", value: "MID" },
      { id: "att", label: "Attaquant", value: "ATT" }
    ],
    league: [
      { id: "ligue1", label: "Ligue 1", value: "Ligue 1" },
      { id: "premier", label: "Premier League", value: "Premier League" },
      { id: "laliga", label: "La Liga", value: "La Liga" },
      { id: "bundesliga", label: "Bundesliga", value: "Bundesliga" }
    ]
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {supabaseStatus && (
        <div className="p-2 bg-green-100 text-green-800 text-sm rounded mb-2">
          {supabaseStatus}
        </div>
      )}
      {/* Header */}
      <header className="bg-card/95 backdrop-blur-md border-b border-border/50 sticky top-0 z-40">
        <div className={`flex items-center justify-between p-4 mx-auto ${isMobile ? 'max-w-md' : isTablet ? 'max-w-2xl' : 'max-w-4xl'}`}>
          <div className="flex items-center gap-3">
            <img 
              src={ballonDorIcon} 
              alt="Ballon d'Or" 
              className="w-10 h-10 animate-float"
            />
            <div>
              <h1 className="text-gradient-gold font-bold text-lg">Ballon d'Or</h1>
              <p className="text-xs text-muted-foreground">2025</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="ghost" 
              className="relative"
              onClick={handleNotificationClick}
            >
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center animate-pulse">
                  <span className="text-xs text-primary-foreground font-bold">
                    {notificationCount}
                  </span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className={`mx-auto p-4 space-y-6 animate-fade-in container-responsive ${isMobile ? 'max-w-md' : isTablet ? 'max-w-2xl' : 'max-w-4xl'}`}>
        {/* Countdown moderne */}
        <div className="flex flex-col items-center justify-center gap-2 py-4">
          <div className="flex items-center gap-3 bg-gradient-to-r from-gold/20 via-primary/10 to-accent/20 rounded-xl px-6 py-3 shadow-lg">
            <svg className="w-8 h-8 text-gold animate-glow" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>
            <div className="flex flex-col items-center">
              <span className="text-gradient-gold font-bold text-lg">Cérémonie officielle</span>
              <span className="text-xs text-muted-foreground">30 Octobre 2025, 20h00</span>
            </div>
          </div>
          <div className="flex gap-4 mt-2 text-center">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-extrabold text-gradient-gold">{countdown.days}</span>
              <span className="text-xs text-muted-foreground">Jours</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-extrabold text-gradient-gold">{String(countdown.hours).padStart(2, '0')}</span>
              <span className="text-xs text-muted-foreground">Heures</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-extrabold text-gradient-gold">{String(countdown.minutes).padStart(2, '0')}</span>
              <span className="text-xs text-muted-foreground">Min</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-extrabold text-gradient-gold">{String(countdown.seconds).padStart(2, '0')}</span>
              <span className="text-xs text-muted-foreground">Sec</span>
            </div>
          </div>
        </div>
        {/* Section Hero */}
        <div className="text-center space-y-4">
          
          <div>
            <h2 className="text-2xl font-bold text-gradient-gold mb-2">
              Votez pour votre favori
            </h2>
            <p className="text-muted-foreground">
              Découvrez les candidats au Ballon d'Or 2025 et participez aux votes de la communauté
            </p>
          </div>
        </div>

        {/* Filtres */}
        

        {/* Top 5 Classement réel */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Top 5 Classement réel</h2>
          <div className="grid gap-4">
            {top5Ranking.map((player, index) => (
              <PlayerCard
                key={player.name}
                player={{
                  ...player,
                  id: player.name,
                  votes: (top5Votes[player.name] || 0) + (player.votes || 0),
                  isLiked: false,
                  slug: undefined,
                }}
                onViewDetails={handleTop5ViewDetails}
                onVote={() => handleTop5Vote(player.name)}
                onLike={() => {}}
              />
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-muted to-card p-6 rounded-2xl text-center space-y-4 border border-border/50">
          <h3 className="text-xl font-bold text-gradient-gold">
            Votre vote compte !
          </h3>
          <p className="text-sm text-muted-foreground">
            Rejoignez des milliers de fans et votez pour le prochain Ballon d'Or
          </p>
          <Link to="/ranking" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 btn-golden w-full">
            Découvrir tous les candidats
          </Link>
        </div>
      </main>

      {/* Modales */}
      {/* <CountdownModal 
        isOpen={showCountdown} 
        onClose={() => setShowCountdown(false)} 
      /> */}

      <PlayerDetailsModal
        player={selectedPlayer}
        isOpen={showPlayerDetails}
        onClose={() => setShowPlayerDetails(false)}
        onVote={() => {}}
        onLike={() => {}}
      />

      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      <SearchModal
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
      />
    </div>
  );
}