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
  useTheme,
} from 'native-base';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

const HomeScreen = () => {
  const navigation = useNavigation();
  const theme = useTheme();

  const QuickAction = ({ icon, label, onPress, color }) => (
    <Pressable
      onPress={onPress}
      flex={1}
      bg={`${color}.100`}
      rounded="xl"
      p={4}
      mr={2}
    >
      <VStack alignItems="center" space={2}>
        <Icon
          as={MaterialCommunityIcons}
          name={icon}
          size={6}
          color={`${color}.600`}
        />
        <Text color={`${color}.600`} fontWeight="medium">
          {label}
        </Text>
      </VStack>
    </Pressable>
  );

  return (
    <ScrollView bg="white">
      <VStack space={6} p={4}>
        {/* Header */}
        <Box>
          <Heading size="lg">Welcome Back, John!</Heading>
          <Text color="gray.500">Here's your health summary</Text>
        </Box>

        {/* Quick Actions */}
        <Box>
          <Heading size="md" mb={4}>
            Quick Actions
          </Heading>
          <HStack space={4}>
            <QuickAction
              icon="calendar-plus"
              label="Book Appointment"
              color="primary"
              onPress={() => navigation.navigate('Appointments')}
            />
            <QuickAction
              icon="pill"
              label="Medications"
              color="secondary"
              onPress={() => {}}
            />
            <QuickAction
              icon="phone-alert"
              label="Emergency"
              color="error"
              onPress={() => navigation.navigate('Emergency')}
            />
          </HStack>
        </Box>

        {/* Health Stats */}
        <Box>
          <Heading size="md" mb={4}>
            Today's Health Stats
          </Heading>
          <VStack space={4}>
            <Box bg="coolGray.100" p={4} rounded="xl">
              <HStack justifyContent="space-between" alignItems="center">
                <VStack>
                  <Text color="coolGray.600">Heart Rate</Text>
                  <Heading size="md">72 BPM</Heading>
                </VStack>
                <Icon
                  as={MaterialCommunityIcons}
                  name="heart-pulse"
                  size={6}
                  color="primary.500"
                />
              </HStack>
            </Box>

            <Box bg="coolGray.100" p={4} rounded="xl">
              <HStack justifyContent="space-between" alignItems="center">
                <VStack>
                  <Text color="coolGray.600">Blood Pressure</Text>
                  <Heading size="md">120/80</Heading>
                </VStack>
                <Icon
                  as={MaterialCommunityIcons}
                  name="gauge"
                  size={6}
                  color="primary.500"
                />
              </HStack>
            </Box>
          </VStack>
        </Box>

        {/* Upcoming Appointments */}
        <Box>
          <Heading size="md" mb={4}>
            Upcoming Appointments
          </Heading>
          <Pressable
            bg="primary.50"
            p={4}
            rounded="xl"
            onPress={() => navigation.navigate('Appointments')}
          >
            <HStack justifyContent="space-between" alignItems="center">
              <VStack>
                <Text color="primary.600" fontWeight="medium">
                  Dr. Sarah Wilson
                </Text>
                <Text color="coolGray.600">General Checkup</Text>
                <Text color="coolGray.500">Tomorrow, 10:00 AM</Text>
              </VStack>
              <Icon
                as={MaterialCommunityIcons}
                name="chevron-right"
                size={6}
                color="primary.500"
              />
            </HStack>
          </Pressable>
        </Box>
      </VStack>
    </ScrollView>
  );
};

export default HomeScreen;
