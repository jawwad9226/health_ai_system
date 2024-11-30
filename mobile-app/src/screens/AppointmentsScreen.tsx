import React, { useState } from 'react';
import {
  Box,
  ScrollView,
  VStack,
  HStack,
  Text,
  Heading,
  Pressable,
  Icon,
  Button,
  Modal,
  FormControl,
  Input,
  Select,
  TextArea,
} from 'native-base';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const AppointmentsScreen = () => {
  const [showModal, setShowModal] = useState(false);

  const AppointmentCard = ({ doctor, type, date, time, status }) => (
    <Box bg="white" p={4} rounded="xl" shadow={1} mb={4}>
      <HStack justifyContent="space-between" alignItems="center" mb={2}>
        <VStack>
          <Text fontSize="lg" fontWeight="bold">
            {doctor}
          </Text>
          <Text color="gray.500">{type}</Text>
        </VStack>
        <Box
          bg={
            status === 'Confirmed'
              ? 'success.100'
              : status === 'Pending'
              ? 'warning.100'
              : 'error.100'
          }
          px={3}
          py={1}
          rounded="full"
        >
          <Text
            color={
              status === 'Confirmed'
                ? 'success.600'
                : status === 'Pending'
                ? 'warning.600'
                : 'error.600'
            }
          >
            {status}
          </Text>
        </Box>
      </HStack>
      <HStack space={4} mt={2}>
        <HStack space={2} alignItems="center">
          <Icon
            as={MaterialCommunityIcons}
            name="calendar"
            size={5}
            color="primary.500"
          />
          <Text color="gray.600">{date}</Text>
        </HStack>
        <HStack space={2} alignItems="center">
          <Icon
            as={MaterialCommunityIcons}
            name="clock"
            size={5}
            color="primary.500"
          />
          <Text color="gray.600">{time}</Text>
        </HStack>
      </HStack>
    </Box>
  );

  return (
    <Box flex={1} bg="coolGray.100">
      <ScrollView>
        <VStack space={6} p={4}>
          {/* Header */}
          <Box>
            <Heading size="lg">Appointments</Heading>
            <Text color="gray.500">Manage your medical appointments</Text>
          </Box>

          {/* New Appointment Button */}
          <Button
            size="lg"
            onPress={() => setShowModal(true)}
            leftIcon={
              <Icon as={MaterialCommunityIcons} name="plus" size="sm" />
            }
          >
            Book New Appointment
          </Button>

          {/* Upcoming Appointments */}
          <Box>
            <Heading size="md" mb={4}>
              Upcoming Appointments
            </Heading>
            <VStack space={3}>
              <AppointmentCard
                doctor="Dr. Sarah Wilson"
                type="General Checkup"
                date="Dec 15, 2023"
                time="10:00 AM"
                status="Confirmed"
              />
              <AppointmentCard
                doctor="Dr. Michael Chen"
                type="Cardiology"
                date="Dec 20, 2023"
                time="2:30 PM"
                status="Pending"
              />
            </VStack>
          </Box>

          {/* Past Appointments */}
          <Box>
            <Heading size="md" mb={4}>
              Past Appointments
            </Heading>
            <VStack space={3}>
              <AppointmentCard
                doctor="Dr. Emily Brown"
                type="Follow-up"
                date="Dec 1, 2023"
                time="11:30 AM"
                status="Completed"
              />
            </VStack>
          </Box>
        </VStack>
      </ScrollView>

      {/* Book Appointment Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} size="lg">
        <Modal.Content>
          <Modal.Header>Book New Appointment</Modal.Header>
          <Modal.Body>
            <VStack space={4}>
              <FormControl>
                <FormControl.Label>Doctor</FormControl.Label>
                <Select placeholder="Select doctor">
                  <Select.Item label="Dr. Sarah Wilson" value="wilson" />
                  <Select.Item label="Dr. Michael Chen" value="chen" />
                  <Select.Item label="Dr. Emily Brown" value="brown" />
                </Select>
              </FormControl>

              <FormControl>
                <FormControl.Label>Appointment Type</FormControl.Label>
                <Select placeholder="Select type">
                  <Select.Item label="General Checkup" value="checkup" />
                  <Select.Item label="Follow-up" value="followup" />
                  <Select.Item label="Consultation" value="consultation" />
                </Select>
              </FormControl>

              <FormControl>
                <FormControl.Label>Preferred Date</FormControl.Label>
                <Input placeholder="Select date" />
              </FormControl>

              <FormControl>
                <FormControl.Label>Preferred Time</FormControl.Label>
                <Input placeholder="Select time" />
              </FormControl>

              <FormControl>
                <FormControl.Label>Notes</FormControl.Label>
                <TextArea placeholder="Add any additional notes" />
              </FormControl>
            </VStack>
          </Modal.Body>
          <Modal.Footer>
            <Button.Group space={2}>
              <Button
                variant="ghost"
                onPress={() => setShowModal(false)}
              >
                Cancel
              </Button>
              <Button
                onPress={() => {
                  setShowModal(false);
                  // Handle booking logic
                }}
              >
                Book Appointment
              </Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </Box>
  );
};

export default AppointmentsScreen;
