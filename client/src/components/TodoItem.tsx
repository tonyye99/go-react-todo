import {
  Badge,
  Box,
  Flex,
  Button,
  Modal,
  ModalBody,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalFooter,
  Spinner,
  Text,
  useToast,
  useDisclosure,
} from "@chakra-ui/react";
import { FaCheckCircle } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { Todo } from "./TodoList";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const TodoItem = ({ todo }: { todo: Todo }) => {
  const query = useQueryClient();
  const toast = useToast();
  const { isOpen, onClose, onOpen } = useDisclosure();

  const { mutate: updateTodo, isPending: isUpdating } = useMutation({
    mutationKey: ["updateTodo"],
    mutationFn: async () => {
      try {
        const res = await fetch(
          import.meta.env.VITE_API_URL + "/api/todos/" + todo._id,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ ...todo, done: !todo.done }),
          },
        );
        const response = await res.json();

        if (!res.ok) {
          throw new Error(response.message);
        }

        return response;
      } catch (error) {
        toast({
          title: "An error occurred.",
          description: (error as { message: string }).message,
          status: "error",
          duration: 9000,
          isClosable: true,
        });
      }
    },
    onSuccess: () => {
      query.invalidateQueries({ queryKey: ["todos"] });
    },
    onError: (error: Error) => {
      toast({
        title: "An error occurred.",
        description: error.message,
        status: "error",
        duration: 9000,
        isClosable: true,
      });
    },
  });

  const { mutate: deleteTodo, isPending: isDeleting } = useMutation({
    mutationKey: ["deleteTodo"],
    mutationFn: async () => {
      try {
        const res = await fetch(
          import.meta.env.VITE_API_URL + "/api/todos/" + todo._id,
          {
            method: "DELETE",
          },
        );
        const response = await res.json();

        if (!res.ok) {
          throw new Error(response.message);
        }

        toast({
          title: todo.title + " deleted.",
          status: "success",
          duration: 5000,
          isClosable: true,
        });

        return response;
      } catch (error) {
        toast({
          title: "An error occurred.",
          description: (error as { message: string }).message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    },
    onSuccess: () => {
      query.invalidateQueries({ queryKey: ["todos"] });
    },
    onError: (error: Error) => {
      toast({
        title: "An error occurred.",
        description: (error as { message: string }).message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    },
  });

  return (
    <Flex gap={2} alignItems={"center"}>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Are you sure?</ModalHeader>
          <ModalCloseButton />
          <ModalBody>It will be deleted permanently.</ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onClose}>
              Close
            </Button>
            <Button variant="ghost" onClick={() => deleteTodo()}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Flex
        flex={1}
        alignItems={"center"}
        border={"1px"}
        borderColor={"gray.600"}
        p={2}
        borderRadius={"lg"}
        justifyContent={"space-between"}
      >
        <Text
          color={todo.done ? "green.200" : "yellow.100"}
          textDecoration={todo.done ? "line-through" : "none"}
        >
          {todo.title}
        </Text>
        {todo.done && (
          <Badge ml="1" colorScheme="green">
            Done
          </Badge>
        )}
        {!todo.done && (
          <Badge ml="1" colorScheme="yellow">
            In Progress
          </Badge>
        )}
      </Flex>
      <Flex gap={2} alignItems={"center"}>
        <Box color={"green.500"} cursor={"pointer"}>
          {!isUpdating && (
            <FaCheckCircle size={20} onClick={() => updateTodo()} />
          )}
          {isUpdating && <Spinner size={"sm"} />}
        </Box>
        <Box color={"red.500"} cursor={"pointer"}>
          {!isDeleting && <MdDelete size={25} onClick={onOpen} />}
          {isDeleting && <Spinner size={"sm"} />}
        </Box>
      </Flex>
    </Flex>
  );
};
export default TodoItem;
