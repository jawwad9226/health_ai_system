import React from 'react';
import {
  Box,
  ScrollView,
  VStack,
  HStack,
  Text,
  Heading,
  Pressable,
  Icon,
  Progress,
  Button,
} from 'native-base';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const HealthTrackingScreen = () => {
  const HealthMetric = ({ icon, label, value, unit, progress }) => (
    <Box bg="white" p={4} rounded="xl" shadow={1} mb={4}>
      <HStack justifyContent="space-between" alignItems="center" mb={2}>
        <HStack space={2} alignItems="center">
          <Icon
            as={MaterialCommunityIcons}
            name={icon}
            size={6}
            color="primary.500"
          />
          <Text fontSize="md" color="gray.700">
            {label}
          </Text>
        </HStack>
        <Text fontSize="lg" fontWeight="bold">
          {value}
          <Text fontSize="sm" color="gray.500">
            {' '}
            {unit}
          </Text>
        </Text>
      </HStack>
      {progress && (
        <Progress
          value={progress}
          size="sm"
          colorScheme={progress > 80 ? 'success' : progress > 50 ? 'warning' : 'error'}
        />
      )}
    </Box>
  );

  return (
    <ScrollView bg="coolGray.100">
      <VStack space={6} p={4}>
        {/* Header */}
        <Box>
          <Heading size="lg">Health Tracking</Heading>
          <Text color="gray.500">Monitor your health metrics</Text>
        </Box>

        {/* Today's Metrics */}
        <Box>
          <HStack justifyContent="space-between" alignItems="center" mb={4}>
            <Heading size="md">Today's Metrics</Heading>
            <Button
              variant="ghost"
              endIcon={
                <Icon
                  as={MaterialCommunityIcons}
                  name="refresh"
                  size={5}
                />
              }
            >
              Refresh
            </Button>
          </HStack>

          <VStack space={4}>
            <HealthMetric
              icon="heart-pulse"
              label="Heart Rate"
              value="72"
              unit="BPM"
              progress={75}
            />
            <HealthMetric
              icon="gauge"
              label="Blood Pressure"
              value="120/80"
              unit="mmHg"
              progress={85}
            />
            <HealthMetric
              icon="run"
              label="Steps"
              value="8,547"
              unit="steps"
              progress={65}
            />
            <HealthMetric
              icon="sleep"
              label="Sleep"
              value="7.5"
              unit="hours"
              progress={80}
            />
          </VStack>
        </Box>

        {/* Quick Add */}
        <Box>
          <Heading size="md" mb={4}>
            Quick Add
          </Heading>
          <HStack space={4}>
            <Pressable
              flex={1}
              bg="primary.100"
              p={4}
              rounded="xl"
              onPress={() => {}}
            >
              <VStack alignItems="center" space={2}>
                <Icon
                  as={MaterialCommunityIcons}
                  name="plus-circle"
                  size={6}
                  color="primary.600"
                />
                <Text color="primary.600" fontWeight="medium">
                  Add Measurement
                </Text>
              </VStack>
            </Pressable>
            <Pressable
              flex={1}
              bg="secondary.100"
              p={4}
              rounded="xl"
              onPress={() => {}}
            >
              <VStack alignItems="center" space={2}>
                <Icon
                  as={MaterialCommunityIcons}
                  name="note-plus"
                  size={6}
                  color="secondary.600"
                />
                <Text color="secondary.600" fontWeight="medium">
                  Add Note
                </Text>
              </VStack>
            </Pressable>
          </HStack>
        </Box>

        {/* Health Insights */}
        <Box>
          <Heading size="md" mb={4}>
            Health Insights
          </Heading>
          <Box bg="info.100" p={4} rounded="xl">
            <HStack space={3} alignItems="center">
              <Icon
                as={MaterialCommunityIcons}
                name="information"
                size={6}
                color="info.600"
              />
              <VStack>
                <Text color="info.600" fontWeight="medium">
                  Your heart rate is optimal
                </Text>
                <Text color="info.500">
                  Keep up the good work with regular exercise
                </Text>
              </VStack>
            </HStack>
          </Box>
        </Box>
      </VStack>
    </ScrollView>
  );
};

export default HealthTrackingScreen;
