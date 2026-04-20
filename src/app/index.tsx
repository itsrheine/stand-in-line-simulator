import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
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
  'You feel like today might be the day. It is not.',
  'You hear “Next!” but it was spiritually, not physically.',
  'You considered leaving. The line noticed.',
];

const INITIAL_LINE_SIZE = 8;
const MAX_LOG_ITEMS = 10;

const SHIRT_COLORS = [
  '#6366F1',
  '#8B5CF6',
  '#F59E0B',
  '#10B981',
  '#3B82F6',
  '#EF4444',
  '#F97316',
  '#14B8A6',
  '#EC4899',
  '#84CC16',
];

const SKIN_COLORS = [
  '#F3C7A6',
  '#E5B58F',
  '#D69B72',
  '#B97A56',
  '#8A5A3C',
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function QueueCharacter({
  isPlayer,
  shirtColor,
  skinColor,
}: {
  isPlayer: boolean;
  shirtColor: string;
  skinColor: string;
}) {
  return (
    <View style={styles.characterWrap}>
      {isPlayer && <View style={styles.playerGlow} />}

      <View style={[styles.characterHead, { backgroundColor: skinColor }]} />

      <View style={styles.hairCap} />

      <View
        style={[
          styles.characterBody,
          { backgroundColor: shirtColor },
          isPlayer && styles.playerBody,
        ]}
      />

      <View style={styles.characterLegsRow}>
        <View style={styles.characterLeg} />
        <View style={styles.characterLeg} />
      </View>

      {isPlayer && (
        <View style={styles.youBubble}>
          <Text style={styles.youBubbleText}>YOU</Text>
        </View>
      )}
    </View>
  );
}

export default function Index() {
  const [line, setLine] = useState<Npc[]>([]);
  const [playerPosition, setPlayerPosition] = useState(INITIAL_LINE_SIZE + 1);
  const [statusText, setStatusText] = useState('You joined the line.');
  const [log, setLog] = useState<EventMessage[]>([]);
  const [timeWaited, setTimeWaited] = useState(0);
  const [progress, setProgress] = useState(6);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [stepReady, setStepReady] = useState(false);
  const [lineClosedCount, setLineClosedCount] = useState(0);
  const [leaveUsed, setLeaveUsed] = useState(false);

  const nextId = useRef(1);
  const stepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chaosIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalPeople = useMemo(() => line.length + 1, [line.length]);

  const visualQueue = useMemo(() => {
    return Array.from({ length: totalPeople }).map((_, index) => {
      const position = index + 1;
      const isPlayer = position === playerPosition;

      return {
        id: position,
        isPlayer,
        name: isPlayer ? 'You' : line[index]?.name || 'Person',
        shirtColor: isPlayer
          ? '#2563EB'
          : SHIRT_COLORS[index % SHIRT_COLORS.length],
        skinColor: SKIN_COLORS[index % SKIN_COLORS.length],
      };
    });
  }, [line, totalPeople, playerPosition]);

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
    if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);
    if (chaosIntervalRef.current) clearInterval(chaosIntervalRef.current);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  };

  const randomMs = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  const addLog = (text: string) => {
    setLog((prev) => {
      const updated = [{ id: nextId.current++, text }, ...prev];
      return updated.slice(0, MAX_LOG_ITEMS);
    });
  };

  const unlockAchievement = (title: string) => {
    setAchievements((prev) =>
      prev.includes(title) ? prev : [...prev, title]
    );
  };

  const initializeGame = () => {
    const startingLine: Npc[] = Array.from(
      { length: INITIAL_LINE_SIZE },
      (_, i) => ({
        id: i + 1,
        name: NPC_NAMES[i % NPC_NAMES.length],
      })
    );

    setLine(startingLine);
    setPlayerPosition(startingLine.length + 1);
    setStatusText('You joined the line.');
    setLog([{ id: nextId.current++, text: 'You entered the line willingly.' }]);
    setTimeWaited(0);
    setProgress(6);
    setAchievements([]);
    setStepReady(false);
    setLineClosedCount(0);
    setLeaveUsed(false);

    cleanupIntervals();

    timerIntervalRef.current = setInterval(() => {
      setTimeWaited((prev) => prev + 1);
    }, 1000);

    stepIntervalRef.current = setInterval(() => {
      const shouldMove = Math.random() > 0.35;
      if (shouldMove) {
        setStepReady(true);
        addLog('The line moved. You may step forward.');
      } else {
        addLog(randomFrom(RARE_EVENTS));
      }
    }, randomMs(7000, 12000));

    chaosIntervalRef.current = setInterval(() => {
      runChaosEvent();
    }, randomMs(5000, 9000));
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
      const progressChanges = [-12, -8, -4, 5, 7, 10];
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
    setProgress((prev) => Math.min(99, prev + Math.floor(Math.random() * 12) + 3));
    setStatusText('You stepped forward.');
    addLog('You stepped forward.');

    if (timeWaited > 90) {
      const fourthWallChance = Math.random();
      if (fourthWallChance > 0.6) {
        const lineText = randomFrom(FOURTH_WALL_LINES);
        setStatusText(lineText);
        addLog(lineText);
      }
    }
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

  const handleLeaveLine = () => {
    setLeaveUsed(true);
    setStatusText('You left the line and instantly regretted it.');
    addLog('You left the line. Your spot is gone forever.');
    unlockAchievement('Gave Up');

    setTimeout(() => {
      setStatusText('You rejoined at the back, humbled.');
      addLog('You returned to the line at the back.');
      setPlayerPosition(line.length + 2);
      setProgress((prev) => Math.max(1, prev - 15));
    }, 1000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const peopleInFront = Math.max(0, playerPosition - 1);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <Text style={styles.title}>Stand in Line Simulator</Text>
          <Text style={styles.subtitle}>
            How long are you willing to wait… for nothing?
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Time Waited</Text>
              <Text style={styles.statValue}>{formatTime(timeWaited)}</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>People Ahead</Text>
              <Text style={styles.statValue}>{peopleInFront}</Text>
            </View>
          </View>

          <View style={styles.progressWrap}>
            <Text style={styles.progressLabel}>Almost There</Text>
            <View style={styles.progressBarOuter}>
              <View style={[styles.progressBarInner, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{progress}%</Text>
          </View>

          <View style={styles.lineCard}>
            <Text style={styles.sectionTitle}>The Line</Text>

            <View style={styles.sceneShell}>
              <View style={styles.counterZone}>
                <View style={styles.cashierHead} />
                <View style={styles.cashierBody} />
                <View style={styles.counterDesk}>
                  <Text style={styles.counterDeskText}>OPEN</Text>
                </View>
              </View>

              <View style={styles.queueScene}>
                <View style={styles.leftRopeTop} />
                <View style={styles.leftRopeBottom} />
                <View style={styles.rightRopeTop} />
                <View style={styles.rightRopeBottom} />

                <View style={styles.floorLane}>
                  {visualQueue.map((person) => (
                    <View key={person.id} style={styles.queueSpot}>
                      <QueueCharacter
                        isPlayer={person.isPlayer}
                        shirtColor={person.shirtColor}
                        skinColor={person.skinColor}
                      />
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>

          <View style={styles.statusCard}>
            <Text style={styles.sectionTitle}>Current Vibe</Text>
            <Text style={styles.statusText}>{statusText}</Text>
          </View>

          <View style={styles.buttonRow}>
            <Pressable
              style={[
                styles.primaryButton,
                !stepReady && styles.primaryButtonDisabled,
              ]}
              onPress={handleStepForward}
            >
              <Text style={styles.primaryButtonText}>STEP FORWARD</Text>
              <Text style={styles.primaryButtonSubtext}>
                {stepReady ? '(the line moved)' : '(waiting...)'}
              </Text>
            </Pressable>

            <Pressable style={styles.secondaryButton} onPress={handleLeaveLine}>
              <Text style={styles.secondaryButtonText}>LEAVE LINE</Text>
              <Text style={styles.secondaryButtonSubtext}>(lose your spot)</Text>
            </Pressable>
          </View>

          <View style={styles.bottomRow}>
            <View style={styles.logCard}>
              <Text style={styles.sectionTitle}>Events</Text>
              <ScrollView style={styles.logList} nestedScrollEnabled>
                {log.map((item) => (
                  <Text key={item.id} style={styles.logItem}>
                    • {item.text}
                  </Text>
                ))}
              </ScrollView>
            </View>

            <View style={styles.achievementCard}>
              <Text style={styles.sectionTitle}>Achievements</Text>
              {achievements.length === 0 ? (
                <Text style={styles.emptyText}>None yet. Incredible.</Text>
              ) : (
                achievements.map((item) => (
                  <Text key={item} style={styles.achievementItem}>
                    🏆 {item}
                  </Text>
                ))
              )}
              {leaveUsed && (
                <Text style={styles.achievementItem}>💀 You learned nothing.</Text>
              )}
            </View>
          </View>

          <Pressable style={styles.resetButton} onPress={initializeGame}>
            <Text style={styles.resetButtonText}>RESET SUFFERING</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#09090B',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    color: '#a1a1aa',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#131316',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#23232A',
  },
  statLabel: {
    color: '#9ca3af',
    fontSize: 12,
    marginBottom: 6,
  },
  statValue: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
  },
  progressWrap: {
    backgroundColor: '#131316',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#23232A',
    marginBottom: 14,
  },
  progressLabel: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 8,
  },
  progressBarOuter: {
    height: 16,
    backgroundColor: '#23232A',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressBarInner: {
    height: '100%',
    backgroundColor: '#7C3AED',
    borderRadius: 999,
  },
  progressText: {
    color: '#c4b5fd',
    marginTop: 8,
    fontSize: 12,
    textAlign: 'right',
    fontWeight: '700',
  },
  lineCard: {
    backgroundColor: '#131316',
    borderRadius: 24,
    padding: 14,
    borderWidth: 1,
    borderColor: '#23232A',
    marginBottom: 14,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 12,
  },
  sceneShell: {
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#0F0F12',
    borderWidth: 1,
    borderColor: '#23232A',
  },
  counterZone: {
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: '#101014',
  },
  cashierHead: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E5B58F',
    marginBottom: -2,
    zIndex: 2,
  },
  cashierBody: {
    width: 42,
    height: 28,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    backgroundColor: '#F97316',
    zIndex: 1,
  },
  counterDesk: {
    marginTop: -2,
    width: 150,
    backgroundColor: '#3F3F46',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#52525B',
  },
  counterDeskText: {
    color: '#D9F99D',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  queueScene: {
    position: 'relative',
    backgroundColor: '#D6D3D1',
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  floorLane: {
    backgroundColor: '#E7E5E4',
    borderRadius: 20,
    paddingTop: 14,
    paddingBottom: 20,
    alignItems: 'center',
    gap: 10,
    minHeight: 520,
  },
  queueSpot: {
    width: '100%',
    alignItems: 'center',
  },
  leftRopeTop: {
    position: 'absolute',
    left: 8,
    top: 80,
    width: 10,
    height: 110,
    borderRadius: 999,
    backgroundColor: '#71717A',
  },
  leftRopeBottom: {
    position: 'absolute',
    left: 8,
    bottom: 80,
    width: 10,
    height: 110,
    borderRadius: 999,
    backgroundColor: '#71717A',
  },
  rightRopeTop: {
    position: 'absolute',
    right: 8,
    top: 80,
    width: 10,
    height: 110,
    borderRadius: 999,
    backgroundColor: '#71717A',
  },
  rightRopeBottom: {
    position: 'absolute',
    right: 8,
    bottom: 80,
    width: 10,
    height: 110,
    borderRadius: 999,
    backgroundColor: '#71717A',
  },
  characterWrap: {
    position: 'relative',
    width: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerGlow: {
    position: 'absolute',
    bottom: 6,
    width: 62,
    height: 18,
    borderRadius: 999,
    backgroundColor: 'rgba(59,130,246,0.28)',
  },
  characterHead: {
    width: 24,
    height: 24,
    borderRadius: 12,
    zIndex: 3,
  },
  hairCap: {
    position: 'absolute',
    top: -1,
    width: 24,
    height: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: '#3F3F46',
    zIndex: 4,
  },
  characterBody: {
    marginTop: -3,
    width: 34,
    height: 34,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    zIndex: 2,
  },
  playerBody: {
    borderWidth: 2,
    borderColor: '#93C5FD',
  },
  characterLegsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: -2,
  },
  characterLeg: {
    width: 7,
    height: 12,
    borderRadius: 4,
    backgroundColor: '#1F2937',
  },
  youBubble: {
    position: 'absolute',
    right: -46,
    top: 20,
    backgroundColor: '#2563EB',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  youBubbleText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  statusCard: {
    backgroundColor: '#131316',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#23232A',
    marginBottom: 14,
  },
  statusText: {
    color: '#E4E4E7',
    fontSize: 15,
    lineHeight: 22,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  primaryButton: {
    flex: 1.15,
    backgroundColor: '#6D28D9',
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: '#4C1D95',
    opacity: 0.85,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  primaryButtonSubtext: {
    color: '#DDD6FE',
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 0.95,
    backgroundColor: '#7F1D1D',
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  secondaryButtonSubtext: {
    color: '#FECACA',
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
  },
  bottomRow: {
    flexDirection: 'row',
    gap: 10,
    minHeight: 220,
  },
  logCard: {
    flex: 1.15,
    backgroundColor: '#131316',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#23232A',
  },
  achievementCard: {
    flex: 0.95,
    backgroundColor: '#131316',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#23232A',
  },
  logList: {
    maxHeight: 210,
  },
  logItem: {
    color: '#E4E4E7',
    fontSize: 13,
    marginBottom: 9,
    lineHeight: 18,
  },
  achievementItem: {
    color: '#E4E4E7',
    fontSize: 13,
    marginBottom: 9,
    lineHeight: 18,
  },
  emptyText: {
    color: '#A1A1AA',
    fontSize: 13,
  },
  resetButton: {
    marginTop: 14,
    backgroundColor: '#18181B',
    borderColor: '#27272A',
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});