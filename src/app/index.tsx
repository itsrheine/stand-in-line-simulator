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
const MAX_LOG_ITEMS = 30;

// change whenever you want
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
  const [stepReady, setStepReady] = useState(false);
  const [lineClosedCount, setLineClosedCount] = useState(0);
  const [leaveUsed, setLeaveUsed] = useState(false);

  const nextId = useRef(1);
  const timeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const moveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chaosIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const playerImage = PLAYER_TYPE === 'boy' ? playerBoyImage : playerGirlImage;
  const totalPeople = useMemo(() => line.length + 1, [line.length]);

  const peopleAhead = Math.max(0, playerPosition - 1);

  const achieved30Seconds = timeWaited >= 30;
  const achievedStillHere = timeWaited >= 60;
  const achievedQuestioning = timeWaited >= 120;
  const lineVeteranProgressMinutes = Math.min(timeWaited / 60, 5);
  const lineVeteranPercent = Math.min((lineVeteranProgressMinutes / 5) * 100, 100);
  const reachedFrontUnlocked = playerPosition === 1 || lineClosedCount > 0;
  const didntMatterUnlocked = lineClosedCount > 0;
  const gaveUpUnlocked = leaveUsed;

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
    setTimeout(() => {
      setStatusText('You rejoined at the back, humbled.');
      addLog('You returned to the line at the back.');
      setPlayerPosition(line.length + 1);
      setProgress((prev) => Math.max(1, prev - 12));
    }, 1000);
  };

  const handleFrontReached = () => {
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
    }, 1200);
  };

  const formatTime = () => {
    const m = Math.floor(timeWaited / 60);
    const s = timeWaited % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

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
            showsVerticalScrollIndicator={false}
          >
            {log.map((item, index) => {
              const eventIcons = ['⬆', '↗', '💬', '👤', '🟣'];
              const eventColors = ['#65a30d', '#3b82f6', '#d97706', '#b45309', '#7c3aed'];

              const icon = eventIcons[index % eventIcons.length];
              const bgColor = eventColors[index % eventColors.length];

              const mins = Math.floor((timeWaited - index * 12) / 60);
              const secs = Math.max(0, (timeWaited - index * 12) % 60);
              const timestamp = `${Math.max(0, mins)}:${String(secs).padStart(2, '0')}`;

              return (
                <View key={item.id} style={styles.eventRowWrap}>
                  <View style={styles.eventRow}>
                    <View style={[styles.eventIconCircle, { backgroundColor: bgColor }]}>
                      <Text style={styles.eventIconText}>{icon}</Text>
                    </View>

                    <View style={styles.eventContent}>
                      <Text style={styles.eventTime}>{timestamp}</Text>
                      <Text style={styles.eventBody}>{item.text}</Text>
                    </View>
                  </View>

                  {index !== log.length - 1 && <View style={styles.eventDivider} />}
                </View>
              );
            })}
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
                    {
                      transform: [{ scale }],
                      top: i * 55, // ✅ spacing fix
                    },
                  ]}
                >
                  {person.isPlayer && <View style={styles.playerGlow} />}

                  <Image
                    source={person.imageSource}
                    style={
                      person.isPlayer
                        ? styles.playerImage
                        : styles.characterImage
                    }
                  />

                  {person.isPlayer && (
                    <View style={styles.youBubble}>
                      <Text style={styles.youText}>YOU</Text>
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

          <View style={styles.achievementsCard}>
            <Text style={styles.sideTitle}>Achievements</Text>

            <View style={styles.achievementRow}>
              <Text style={styles.achievementIcon}>⏳</Text>
              <Text style={styles.achievementText}>Waited 30 Seconds</Text>
              <Text style={styles.achievementCheck}>{achieved30Seconds ? '✔' : ''}</Text>
            </View>

            <View style={styles.achievementRow}>
              <Text style={styles.achievementIcon}>🏆</Text>
              <Text style={styles.achievementText}>Still Here?</Text>
              <Text style={styles.achievementCheck}>{achievedStillHere ? '✔' : ''}</Text>
            </View>

            <View style={styles.achievementRow}>
              <Text style={styles.achievementIcon}>🧠</Text>
              <Text style={styles.achievementText}>Questioning Life Choices</Text>
              <Text style={styles.achievementCheck}>{achievedQuestioning ? '✔' : ''}</Text>
            </View>

            <View style={styles.achievementBlock}>
              <View style={styles.achievementRow}>
                <Text style={styles.achievementIcon}>⭐</Text>
                <Text style={styles.achievementText}>Line Veteran</Text>
              </View>

              <View style={styles.miniProgressTrack}>
                <View
                  style={[
                    styles.miniProgressFill,
                    { width: `${lineVeteranPercent}%` },
                  ]}
                />
              </View>

              <Text style={styles.miniProgressText}>
                {lineVeteranProgressMinutes.toFixed(1)} / 5 min
              </Text>
            </View>

            <View style={styles.achievementRow}>
              <Text style={styles.achievementIcon}>🚫</Text>
              <Text style={styles.achievementText}>Reached the Front</Text>
              <Text style={styles.lockedText}>{reachedFrontUnlocked ? '✔' : '0/1'}</Text>
            </View>

            <View style={styles.achievementRow}>
              <Text style={styles.achievementIcon}>💀</Text>
              <Text style={styles.achievementText}>Didn’t Matter</Text>
              <Text style={styles.lockedText}>{didntMatterUnlocked ? '✔' : '0/1'}</Text>
            </View>

            <View style={styles.achievementRow}>
              <Text style={styles.achievementIcon}>🏳️</Text>
              <Text style={styles.achievementText}>Gave Up</Text>
              <Text style={styles.lockedText}>{gaveUpUnlocked ? '✔' : '0/1'}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.primaryBtn, !stepReady && styles.primaryBtnDisabled]}
          onPress={handleStepForward}
        >
          <View style={styles.buttonInner}>
            <Text style={styles.buttonIcon}>🚶</Text>
            <View>
              <Text style={styles.btnText}>STEP FORWARD</Text>
              <Text style={styles.btnSubText}>
                {stepReady ? '(the line moved)' : '(waiting...)'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dangerBtn} onPress={handleLeaveLine}>
          <View style={styles.buttonInner}>
            <Text style={styles.buttonIcon}>🚪</Text>
            <View>
              <Text style={styles.btnText}>LEAVE LINE</Text>
              <Text style={styles.btnSubTextDanger}>(lose your spot)</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.resetBtn} onPress={initializeGame}>
        <View style={styles.resetInner}>
          <Text style={styles.resetIcon}>↻</Text>
          <Text style={styles.resetText}>RESET SUFFERING</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  /* ---------- LAYOUT ---------- */
  container: {
    flex: 1,
    backgroundColor: '#05070c',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
  },

  /* ---------- TITLE ---------- */
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

  /* ---------- TOP STATS ---------- */
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

  /* ---------- PROGRESS ---------- */
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

  /* ---------- SIDE TITLES ---------- */
  sideTitle: {
    color: '#a78bfa',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
  },

  /* ---------- ACHIEVEMENTS ---------- */
  achievementsCard: {
    marginTop: 10,
  },

  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  achievementIcon: {
    fontSize: 18,
    marginRight: 10,
  },

  achievementText: {
    flex: 1,
    color: '#e5e7eb',
    fontSize: 12,
  },

  achievementCheck: {
    color: '#22c55e',
    fontWeight: '800',
    fontSize: 14,
  },

  lockedText: {
    color: '#64748b',
    fontSize: 11,
  },

  achievementBlock: {
    marginBottom: 12,
  },

  miniProgressTrack: {
    height: 6,
    backgroundColor: '#2a3344',
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 4,
  },

  miniProgressFill: {
    height: '100%',
    backgroundColor: '#7c3aed',
  },

  miniProgressText: {
    color: '#a78bfa',
    fontSize: 10,
    marginTop: 2,
  },

  /* ---------- BUTTONS ---------- */
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },

  primaryBtn: {
    flex: 1,
    backgroundColor: '#6d28d9',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },

  primaryBtnDisabled: {
    opacity: 0.78,
  },

  dangerBtn: {
    flex: 1,
    backgroundColor: '#8b1e1e',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },

  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonIcon: {
    fontSize: 26,
    marginRight: 12,
  },

  btnText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 14,
    lineHeight: 18,
  },

  btnSubText: {
    color: '#ddd6fe',
    marginTop: 2,
    fontSize: 10,
    fontWeight: '700',
  },

  btnSubTextDanger: {
    color: '#fecaca',
    marginTop: 2,
    fontSize: 10,
    fontWeight: '700',
  },

  resetBtn: {
    backgroundColor: '#111827',
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1f2937',
  },

  resetInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  resetIcon: {
    color: '#94a3b8',
    fontSize: 18,
    marginRight: 8,
  },

  resetText: {
    color: '#94a3b8',
    fontWeight: '800',
    fontSize: 12,
  },

  statTextWrap: {
    flex: 1,
  },

  mainRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },

  sideCard: {
    flex: 1,
    backgroundColor: '#0b132b',
    borderRadius: 18,
    padding: 12,
    height: 430, // matches your scene height
    borderWidth: 1,
    borderColor: '#1f2937',
  },

  /* ---------- CENTER CARD (THE LINE) ---------- */
  centerCard: {
    flex: 1.6,
    backgroundColor: '#0b132b',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    overflow: 'hidden',
  },

  /* ---------- SCENE (IMAGE AREA) ---------- */
  scene: {
    height: 430,
    overflow: 'hidden',
  },

  sceneImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },

  /* ---------- EVENTS SCROLL ---------- */
  eventsScroll: {
    flex: 1,
  },

  eventsScrollContent: {
    paddingBottom: 8,
  },

  eventRowWrap: {
    marginBottom: 12,
  },

  eventRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  eventIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },

  eventIconText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },

  eventContent: {
    flex: 1,
  },

  eventTime: {
    color: '#cbd5e1',
    fontSize: 11,
    marginBottom: 4,
  },

  eventBody: {
    color: '#e5e7eb',
    fontSize: 12,
    lineHeight: 19,
  },

  eventDivider: {
    height: 1,
    backgroundColor: '#1f2937',
    marginTop: 12,
    marginLeft: 44,
  },

  /* ---------- VIBE CARD ---------- */
  vibe: {
    backgroundColor: '#0b132b',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginBottom: 10,
  },

  /* ---------- "YOU" SPEECH BUBBLE ---------- */
  youBubble: {
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
    backgroundColor: '#7c3aed',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    zIndex: 5,
  },

  youText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '800',
  },

  /* ---------- PLAYER (YOU) ---------- */
  playerImage: {
    width: 70,
    height: 70,
    resizeMode: 'contain',
    zIndex: 3,
  },

  playerGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(124, 58, 237, 0.25)',
    zIndex: 2,
  },

    /* ---------- OTHER CHARACTERS ---------- */
  characterImage: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },

  /* ---------- QUEUE POSITIONING ---------- */
  queueItem: {
    position: 'absolute',
    alignItems: 'center',
  },

  queue: {
  position: 'absolute',
  top: 40,
  left: '50%',
  transform: [{ translateX: -20 }],
  alignItems: 'center',
},
});