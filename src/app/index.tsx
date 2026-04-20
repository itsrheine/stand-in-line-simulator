import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import {
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Npc = {
  id: number;
  name: string;
};

type EventMessage = {
  id: number;
  text: string;
};

const NPC_NAMES = [
  'Tired Dad',
  'Phone Girl',
  'Coupon Lady',
  'Guy in Hoodie',
  'Snack Kid',
  'Mystery Grandma',
  'Tourist',
  'Overthinker',
  'Silent Dude',
  'Lady With Cart',
];

const NPC_DIALOGUE = [
  'I’ve been here since 2017.',
  'This line moved earlier, I swear.',
  'You picked the slow line.',
  'Don’t make eye contact with the cashier.',
  'I almost left. Big mistake.',
  'I think the other line is fake.',
  'We’re close. Probably.',
  'I forgot why I got in line.',
  'This builds character.',
  'Manager is coming.',
];

const FOURTH_WALL_LINES = [
  'You could have left already.',
  'This is a choice you are making.',
  'Nobody asked you to stay.',
  'At this point, this line owns you.',
  'You are now part of the line.',
];

const DELAY_EVENTS = [
  'A customer started arguing with the cashier.',
  'A crying kid changed the atmosphere.',
  'Someone is paying in coins.',
  'Price check. Nobody knows for what.',
  'The cashier disappeared for a moment.',
];

const RARE_EVENTS = [
  'A second line appears… but it is somehow worse.',
  'You hear “Next!” but it was spiritually, not physically.',
  'You considered leaving. The line noticed.',
  'The line moved in your heart, not in real life.',
];

const INITIAL_LINE_SIZE = 8;
const MAX_LOG_ITEMS = 10;

// change to 'girl' whenever you want
const PLAYER_TYPE: 'boy' | 'girl' = 'boy';

const queueCharacterImages = [
  require('../../assets/characters/char1.png'),
  require('../../assets/characters/char2.png'),
  require('../../assets/characters/char3.png'),
  require('../../assets/characters/char4.png'),
  require('../../assets/characters/char5.png'),
  require('../../assets/characters/char6.png'),
  require('../../assets/characters/char7.png'),
  require('../../assets/characters/char8.png'),
];

const playerBoyImage = require('../../assets/characters/player-boy.png');
const playerGirlImage = require('../../assets/characters/player-girl.png');
const lineBackground = require('../../assets/backgrounds/line.png');

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function Index() {
  const [line, setLine] = useState<Npc[]>([]);
  const [playerPosition, setPlayerPosition] = useState(INITIAL_LINE_SIZE + 1);
  const [statusText, setStatusText] = useState('You entered the line willingly.');
  const [log, setLog] = useState<EventMessage[]>([]);
  const [timeWaited, setTimeWaited] = useState(0);
  const [progress, setProgress] = useState(1);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [stepReady, setStepReady] = useState(false);
  const [lineClosedCount, setLineClosedCount] = useState(0);
  const [leaveUsed, setLeaveUsed] = useState(false);

  const nextId = useRef(1);
  const timeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const moveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chaosIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const playerImage = PLAYER_TYPE === 'boy' ? playerBoyImage : playerGirlImage;

  const totalPeople = useMemo(() => line.length + 1, [line.length]);

  const visualQueue = useMemo(() => {
    return Array.from({ length: totalPeople }).map((_, index) => {
      const position = index + 1;
      const isPlayer = position === playerPosition;

      return {
        id: position,
        isPlayer,
        imageSource: isPlayer
          ? playerImage
          : queueCharacterImages[index % queueCharacterImages.length],
      };
    });
  }, [line, totalPeople, playerPosition, playerImage]);

  useEffect(() => {
    initializeGame();

    return () => {
      cleanupIntervals();
    };
  }, []);

  useEffect(() => {
    if (timeWaited === 30) unlockAchievement('Waited 30 Seconds');
    if (timeWaited === 60) unlockAchievement('Still Here?');
    if (timeWaited === 120) unlockAchievement('Questioning Life Choices');
    if (timeWaited === 300) unlockAchievement('Line Veteran');
  }, [timeWaited]);

  useEffect(() => {
    if (playerPosition <= 2 && playerPosition > 1) {
      setStatusText('You are near the front. Something feels wrong.');
    }

    if (playerPosition === 1) {
      handleFrontReached();
    }
  }, [playerPosition]);

  const cleanupIntervals = () => {
    if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
    if (moveIntervalRef.current) clearInterval(moveIntervalRef.current);
    if (chaosIntervalRef.current) clearInterval(chaosIntervalRef.current);
  };

  const addLog = (text: string) => {
    setLog((prev) => {
      const updated = [{ id: nextId.current++, text }, ...prev];
      return updated.slice(0, MAX_LOG_ITEMS);
    });
  };

  const unlockAchievement = (title: string) => {
    setAchievements((prev) => (prev.includes(title) ? prev : [...prev, title]));
  };

  const initializeGame = () => {
    const startingLine: Npc[] = Array.from({ length: INITIAL_LINE_SIZE }, (_, i) => ({
      id: i + 1,
      name: NPC_NAMES[i % NPC_NAMES.length],
    }));

    setLine(startingLine);
    setPlayerPosition(startingLine.length + 1);
    setStatusText('You entered the line willingly.');
    setLog([{ id: nextId.current++, text: 'You entered the line willingly.' }]);
    setTimeWaited(0);
    setProgress(1);
    setAchievements([]);
    setStepReady(false);
    setLineClosedCount(0);
    setLeaveUsed(false);

    cleanupIntervals();

    timeIntervalRef.current = setInterval(() => {
      setTimeWaited((prev) => prev + 1);
    }, 1000);

    moveIntervalRef.current = setInterval(() => {
      const shouldMove = Math.random() > 0.35;

      if (shouldMove) {
        setStepReady(true);
        addLog('The line moved. You may step forward.');
      } else {
        addLog(randomFrom(RARE_EVENTS));
      }
    }, 9000);

    chaosIntervalRef.current = setInterval(() => {
      runChaosEvent();
    }, 7000);
  };

  const runChaosEvent = () => {
    const roll = Math.random();

    if (roll < 0.35) {
      const npc = randomFrom(NPC_DIALOGUE);
      setStatusText(npc);
      addLog(`NPC: "${npc}"`);
      return;
    }

    if (roll < 0.65) {
      const progressChanges = [-8, -4, 5, 7, 10];
      const change =
        progressChanges[Math.floor(Math.random() * progressChanges.length)];

      const fakeProgress = Math.max(1, Math.min(99, progress + change));
      setProgress(fakeProgress);
      addLog(`Progress updated: ${fakeProgress}% almost there.`);
      return;
    }

    if (roll < 0.82) {
      const event = randomFrom(DELAY_EVENTS);
      setStatusText(event);
      addLog(event);
      setPlayerPosition((prev) => prev + 1);
      return;
    }

    setStatusText('Someone cut in front of you like it was destiny.');
    addLog('A random person cut in front of you.');
    setPlayerPosition((prev) => prev + 1);
  };

  const handleStepForward = () => {
    if (!stepReady) {
      setStatusText('The line has not moved yet.');
      addLog('You tried to step forward illegally.');
      return;
    }

    setPlayerPosition((prev) => Math.max(1, prev - 1));
    setStepReady(false);
    setProgress((prev) => Math.min(99, prev + Math.floor(Math.random() * 10) + 5));
    setStatusText('You stepped forward.');
    addLog('You stepped forward.');

    if (timeWaited > 90 && Math.random() > 0.55) {
      const lineText = randomFrom(FOURTH_WALL_LINES);
      setStatusText(lineText);
      addLog(lineText);
    }
  };

  const handleLeaveLine = () => {
    setLeaveUsed(true);
    setStatusText('You left the line and instantly regretted it.');
    addLog('You left the line.');
    unlockAchievement('Gave Up');

    setTimeout(() => {
      setStatusText('You rejoined at the back, humbled.');
      addLog('You returned to the line at the back.');
      setPlayerPosition(line.length + 1);
      setProgress((prev) => Math.max(1, prev - 12));
    }, 1000);
  };

  const handleFrontReached = () => {
    unlockAchievement('Reached the Front');
    addLog('You reached the front.');
    setStatusText('You made it to the front.');

    setTimeout(() => {
      const closedMessage =
        Math.random() > 0.5
          ? 'Closed. Please form new line.'
          : 'Register closed. Please join the other line. There is no other line.';

      addLog(closedMessage);
      setStatusText(closedMessage);

      const extraPeople = Math.floor(Math.random() * 4) + INITIAL_LINE_SIZE;
      const newLine: Npc[] = Array.from({ length: extraPeople }, (_, i) => ({
        id: 1000 + lineClosedCount * 100 + i,
        name: NPC_NAMES[Math.floor(Math.random() * NPC_NAMES.length)],
      }));

      setLine(newLine);
      setPlayerPosition(newLine.length + 1);
      setProgress(Math.floor(Math.random() * 12) + 3);
      setLineClosedCount((prev) => prev + 1);
      unlockAchievement('Didn’t Matter');
    }, 1200);
  };

  const formatTime = () => {
    const m = Math.floor(timeWaited / 60);
    const s = timeWaited % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const peopleAhead = Math.max(0, playerPosition - 1);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Stand in Line Simulator</Text>
      <Text style={styles.subtitle}>
        How long are you willing to wait… for nothing?
      </Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={styles.statIconWrap}>
            <Ionicons name="time" size={22} color="#ffffff" />
          </View>

          <View style={styles.statTextWrap}>
            <Text style={styles.statLabel}>Time Waited</Text>
            <Text style={styles.statValue}>{formatTime()}</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconWrap}>
            <MaterialCommunityIcons name="account-group" size={22} color="#ffffff" />
          </View>

          <View style={styles.statTextWrap}>
            <Text style={styles.statLabel}>People Ahead</Text>
            <Text style={styles.statValue}>{peopleAhead}</Text>
          </View>
        </View>
      </View>

        <View style={styles.progressCard}>
          <Text style={styles.progressLabel}>Almost There</Text>

          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(progress, 100)}%` },
                ]}
              />
            </View>

            <Text style={styles.progressPercent}>{progress}%</Text>
          </View>
        </View>

      <View style={styles.mainRow}>
        <View style={styles.sideCard}>
          <Text style={styles.sideTitle}>Events</Text>
          <ScrollView
            style={styles.eventsScroll}
            contentContainerStyle={styles.eventsScrollContent}
            showsVerticalScrollIndicator
          >
            {log.map((item) => (
              <Text key={item.id} style={styles.eventText}>
                • {item.text}
              </Text>
            ))}
          </ScrollView>
        </View>

        <View style={styles.centerCard}>
          <Text style={styles.sideTitle}>The Line</Text>

          <ImageBackground
            source={lineBackground}
            style={styles.scene}
            imageStyle={styles.sceneImage}
            resizeMode="cover"
          >
          <View style={styles.queue}>
            {visualQueue.map((person, i) => {
              const scale = person.isPlayer ? 1 : Math.max(0.62, 1 - i * 0.06);

              return (
                <View
                  key={person.id}
                  style={[
                    styles.queueItem,
                    { transform: [{ scale }] },
                  ]}
                >
                  {person.isPlayer && <View style={styles.playerGlow} />}

                  <Image
                    source={person.imageSource}
                    style={person.isPlayer ? styles.playerImage : styles.characterImage}
                  />

                  {person.isPlayer && (
                    <View style={styles.youBubble}>
                      <Text style={styles.youBubbleText}>YOU</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
          </ImageBackground>
        </View>

        <View style={styles.sideCard}>
          <Text style={styles.sideTitle}>Current Vibe</Text>
          <Text style={styles.vibe}>{statusText}</Text>

          <Text style={[styles.sideTitle, { marginTop: 18 }]}>Achievements</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {achievements.length === 0 ? (
              <Text style={styles.eventText}>None yet. Incredible.</Text>
            ) : (
              achievements.map((item) => (
                <Text key={item} style={styles.eventText}>
                  🏆 {item}
                </Text>
              ))
            )}
            {leaveUsed && <Text style={styles.eventText}>💀 You learned nothing.</Text>}
          </ScrollView>
        </View>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.primaryBtn, !stepReady && styles.primaryBtnDisabled]}
          onPress={handleStepForward}
        >
          <Text style={styles.btnText}>STEP FORWARD</Text>
          <Text style={styles.btnSubText}>
            {stepReady ? '(the line moved)' : '(waiting...)'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dangerBtn} onPress={handleLeaveLine}>
          <Text style={styles.btnText}>LEAVE LINE</Text>
          <Text style={styles.btnSubTextDanger}>(lose your spot)</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.resetBtn} onPress={initializeGame}>
        <Text style={styles.resetText}>RESET SUFFERING</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05070c',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
  },

  title: {
    color: 'white',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 2,
  },

  subtitle: {
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 11,
  },

statsRow: {
  flexDirection: 'row',
  gap: 8,
  marginBottom: 10,
},

statCard: {
  flex: 1,
  backgroundColor: '#0b132b',
  borderRadius: 16,
  paddingVertical: 12,
  paddingHorizontal: 14,
  borderWidth: 1,
  borderColor: '#1f2937',
  flexDirection: 'row',
  alignItems: 'center',
},

statIconWrap: {
  width: 44,
  height: 44,
  borderRadius: 22,
  backgroundColor: '#7c3aed',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: 12,
},


statTextWrap: {
  flex: 1,
},

statLabel: {
  color: '#cbd5e1',
  fontSize: 11,
  marginBottom: 4,
},

statValue: {
  color: '#ffffff',
  fontSize: 20,
  fontWeight: '800',
},

progressCard: {
  backgroundColor: '#0b132b',
  borderRadius: 16,
  paddingTop: 10,
  paddingBottom: 10,
  paddingHorizontal: 14,
  borderWidth: 1,
  borderColor: '#1f2937',
  marginBottom: 12,
},

progressLabel: {
  color: '#ffffff',
  fontSize: 11,
  fontWeight: '600',
  marginBottom: 8,
},

progressRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,
},

progressTrack: {
  flex: 1,
  height: 10,
  backgroundColor: '#2a3344',
  borderRadius: 999,
  overflow: 'hidden',
},

progressFill: {
  height: '100%',
  backgroundColor: '#7c3aed',
  borderRadius: 999,
  minWidth: 10,
},

progressPercent: {
  color: '#a78bfa',
  fontSize: 11,
  fontWeight: '700',
},

  mainRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
    alignItems: 'stretch',
  },

  sideCard: {
    flex: 1,
    backgroundColor: '#0b132b',
    borderRadius: 18,
    padding: 12,
    height: 430,
    borderWidth: 1,
    borderColor: '#1f2937',
  },

  centerCard: {
    flex: 1.6,
    backgroundColor: '#0b132b',
    borderRadius: 18,
    padding: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1f2937',
  },

  sideTitle: {
    color: '#a78bfa',
    fontWeight: '800',
    fontSize: 15,
    marginBottom: 8,
  },

  eventText: {
    color: '#d1d5db',
    marginBottom: 10,
    lineHeight: 22,
    fontSize: 13,
  },

  vibe: {
    color: 'white',
    backgroundColor: '#4c1d95',
    padding: 14,
    borderRadius: 16,
    lineHeight: 24,
    fontSize: 14,
  },

  scene: {
    height: 430,
    overflow: 'hidden',
  },

  sceneImage: {
    borderRadius: 16,
  },

  queue: {
    position: 'absolute',
    left: '50%',
    top: 118,
    transform: [{ translateX: -10 }],
    alignItems: 'center',
  },

  queueItem: {
    marginBottom: -12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  characterImage: {
     width: 40,
      height: 40,
      resizeMode: 'contain',
  },

  playerImage: {
     width: 48,
  height: 48,
  resizeMode: 'contain',
  },

  playerGlow: {
    position: 'absolute',
    bottom: 2,
    width: 54,
    height: 16,
    borderRadius: 999,
    backgroundColor: 'rgba(59,130,246,0.35)',
  },

  youBubble: {
    position: 'absolute',
    right: -64,
    top: 18,
    backgroundColor: '#3b82f6',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },

  youBubbleText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },

  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },

  primaryBtn: {
    flex: 1,
    backgroundColor: '#6d28d9',
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
  },

  primaryBtnDisabled: {
    opacity: 0.75,
  },

  dangerBtn: {
    flex: 1,
    backgroundColor: '#8b1e1e',
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
  },

  btnText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 16,
  },

  btnSubText: {
    color: '#ddd6fe',
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
  },

  btnSubTextDanger: {
    color: '#fecaca',
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
  },

  resetBtn: {
    backgroundColor: '#111827',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1f2937',
  },

  resetText: {
    color: '#d1d5db',
    fontWeight: '800',
    fontSize: 14,
  },

  eventsScroll: {
    flex: 1,
  },

  eventsScrollContent: {
    paddingBottom: 8,
  },
});