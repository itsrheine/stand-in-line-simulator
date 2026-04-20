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

  const randomFrom = (arr: string[]) =>
    arr[Math.floor(Math.random() * arr.length)];

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
    const startingLine: Npc[] = Array.from({ length: INITIAL_LINE_SIZE }, (_, i) => ({
      id: i + 1,
      name: NPC_NAMES[i % NPC_NAMES.length],
    }));

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

    <View style={styles.counterArea}>
      <Text style={styles.counterEmoji}>🛒</Text>
      <Text style={styles.counterText}>Counter</Text>
    </View>

    <ScrollView
      style={styles.visualLineScroll}
      contentContainerStyle={styles.visualLineContent}
      showsVerticalScrollIndicator={false}
    >
      {Array.from({ length: totalPeople }).map((_, index) => {
        const visualPosition = index + 1;
        const isPlayer = visualPosition === playerPosition;

        return (
          <View
            key={isPlayer ? 'player' : `npc-${index}`}
            style={[
              styles.visualPersonWrap,
              isPlayer && styles.visualPlayerWrap,
            ]}
          >
            <Text style={styles.visualPersonEmoji}>
              {isPlayer ? '🧍' : '😐'}
            </Text>

            <View style={styles.visualBubble}>
              <Text style={styles.visualName}>
                {isPlayer ? 'You' : line[index]?.name || 'Person'}
              </Text>
              <Text style={styles.visualPlace}>
                {visualPosition === 1 ? 'Front of line' : `Spot ${visualPosition}`}
              </Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  </View> 

        <View style={styles.statusCard}>
          <Text style={styles.sectionTitle}>Current Vibe</Text>
          <Text style={styles.statusText}>{statusText}</Text>
        </View>

        <View style={styles.buttonRow}>
          <Pressable style={styles.primaryButton} onPress={handleStepForward}>
            <Text style={styles.primaryButtonText}>
              {stepReady ? 'STEP FORWARD' : 'WAIT'}
            </Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={handleLeaveLine}>
            <Text style={styles.secondaryButtonText}>LEAVE LINE</Text>
          </Pressable>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.logCard}>
            <Text style={styles.sectionTitle}>Events</Text>
            <ScrollView style={styles.logList}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#111111',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: '#bdbdbd',
    fontSize: 14,
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
    backgroundColor: '#1d1d1d',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2c2c2c',
  },
  statLabel: {
    color: '#9a9a9a',
    fontSize: 12,
    marginBottom: 6,
  },
  statValue: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
  },
  progressWrap: {
    backgroundColor: '#1d1d1d',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2c2c2c',
    marginBottom: 14,
  },
  progressLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  progressBarOuter: {
    height: 16,
    backgroundColor: '#2c2c2c',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressBarInner: {
    height: '100%',
    backgroundColor: '#6f6f6f',
    borderRadius: 999,
  },
  progressText: {
    color: '#bdbdbd',
    marginTop: 8,
    fontSize: 12,
    textAlign: 'right',
  },
  lineCard: {
    flex: 1,
    minHeight: 180,
    backgroundColor: '#1d1d1d',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2c2c2c',
    marginBottom: 14,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  lineList: {
    flex: 1,
  },
  lineListContent: {
    paddingBottom: 8,
    gap: 8,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#262626',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  playerRow: {
    backgroundColor: '#343434',
    borderWidth: 1,
    borderColor: '#5a5a5a',
  },
  personEmoji: {
    fontSize: 20,
    width: 30,
  },
  personText: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  personPlace: {
    color: '#bdbdbd',
    fontSize: 12,
  },
  statusCard: {
    backgroundColor: '#1d1d1d',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2c2c2c',
    marginBottom: 14,
  },
  statusText: {
    color: '#d6d6d6',
    fontSize: 14,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  primaryButton: {
    flex: 1.2,
    backgroundColor: '#e8e8e8',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  secondaryButton: {
    flex: 0.9,
    backgroundColor: '#2a2a2a',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444444',
  },
  secondaryButtonText: {
    color: '#f0f0f0',
    fontSize: 13,
    fontWeight: '700',
  },
  bottomRow: {
    flexDirection: 'row',
    gap: 10,
    minHeight: 150,
  },
  logCard: {
    flex: 1.2,
    backgroundColor: '#1d1d1d',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2c2c2c',
  },
  achievementCard: {
    flex: 0.9,
    backgroundColor: '#1d1d1d',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2c2c2c',
  },
  logList: {
    flex: 1,
  },
  logItem: {
    color: '#d1d1d1',
    fontSize: 12,
    marginBottom: 8,
    lineHeight: 17,
  },
  achievementItem: {
    color: '#e4e4e4',
    fontSize: 12,
    marginBottom: 8,
    lineHeight: 17,
  },
  emptyText: {
    color: '#9f9f9f',
    fontSize: 12,
  },
  resetButton: {
    marginTop: 14,
    backgroundColor: '#151515',
    borderColor: '#3a3a3a',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  counterArea: {
  alignItems: 'center',
  marginBottom: 14,
},

counterEmoji: {
  fontSize: 34,
  marginBottom: 4,
},

counterText: {
  color: '#bdbdbd',
  fontSize: 12,
  fontWeight: '600',
},

visualLineScroll: {
  flex: 1,
},

visualLineContent: {
  paddingBottom: 10,
  gap: 10,
},

visualPersonWrap: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
},

visualPlayerWrap: {
  transform: [{ scale: 1.03 }],
},

visualPersonEmoji: {
  fontSize: 34,
  marginRight: 12,
},

visualBubble: {
  minWidth: 170,
  backgroundColor: '#262626',
  borderRadius: 14,
  paddingVertical: 10,
  paddingHorizontal: 14,
  borderWidth: 1,
  borderColor: '#333333',
},

visualName: {
  color: '#ffffff',
  fontSize: 14,
  fontWeight: '700',
},

visualPlace: {
  color: '#a9a9a9',
  fontSize: 12,
  marginTop: 2,
},
});