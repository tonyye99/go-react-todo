package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Todo struct {
	ID          primitive.ObjectID `json:"_id,omitempty" bson:"_id,omitempty"`
	Title       string             `json:"title"`
	Description string             `json:"description"`
	Done        bool               `json:"done"`
}

var collection *mongo.Collection

func main() {
	if os.Getenv("ENV") != "production" {
		err := godotenv.Load(".env")
		if err != nil {
			log.Fatal("Error loading .env file")
		}
	}

	fmt.Println("ENV: ", os.Getenv("MONGODB_URI"))

	MONGODB_URI := os.Getenv("MONGODB_URI")
	clientOptions := options.Client().ApplyURI(MONGODB_URI)
	client, err := mongo.Connect(context.Background(), clientOptions)
	if err != nil {
		log.Fatal(err)
	}

	defer client.Disconnect(context.Background())

	err = client.Ping(context.Background(), nil)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("Connected to MongoDB!")

	collection = client.Database("GoReactTodo").Collection("todos")

	app := fiber.New()

	app.Use(cors.New(cors.Config{
		AllowOrigins: "http://localhost:5173",
		AllowHeaders: "Origin,Content-Type,Accept",
	}))

	// Routes
	app.Get("/api/todos", getTodos)
	app.Post("/api/todos", createTodo)
	app.Patch("/api/todos/:id", updateTodo)
	app.Delete("/api/todos/:id", deleteTodo)

	PORT := os.Getenv("PORT")

	log.Fatal(app.Listen(":" + PORT))
}

func getTodos(c *fiber.Ctx) error {
	todos := []Todo{}

	cursor, err := collection.Find(context.Background(), bson.M{})
	if err != nil {
		log.Fatal(err)
		return c.Status(500).JSON(fiber.Map{"message": "Failed to get todos"})
	}

	defer cursor.Close(context.Background())

	for cursor.Next(context.Background()) {
		var todo Todo
		cursor.Decode(&todo)
		todos = append(todos, todo)
	}

	return c.JSON(todos)
}

func createTodo(c *fiber.Ctx) error {
	todo := new(Todo)

	if err := c.BodyParser(todo); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Invalid JSON"})
	}

	result, err := collection.InsertOne(context.Background(), todo)
	if err != nil {
		log.Fatal(err)
		return c.Status(500).JSON(fiber.Map{"message": "Failed to create todo"})
	}

	todo.ID = result.InsertedID.(primitive.ObjectID)

	return c.Status(201).JSON(todo)
}

func updateTodo(c *fiber.Ctx) error {
	todo := new(Todo)
	if err := c.BodyParser(todo); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Invalid JSON"})
	}

	id, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Invalid ID"})
	}

	filter := bson.M{"_id": id}
	update := bson.M{"$set": bson.M{"done": todo.Done, "title": todo.Title, "description": todo.Description}}

	_, err = collection.UpdateOne(context.Background(), filter, update)
	if err != nil {
		log.Fatal(err)
		return c.Status(500).JSON(fiber.Map{"message": "Failed to update todo"})
	}

	return c.Status(200).JSON(fiber.Map{"message": "Todo updated successfully"})
}

func deleteTodo(c *fiber.Ctx) error {
	id, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Invalid ID"})
	}

	filter := bson.M{"_id": id}
	_, err = collection.DeleteOne(context.Background(), filter)
	if err != nil {
		log.Fatal(err)
		return c.Status(500).JSON(fiber.Map{"message": "Failed to delete todo"})
	}

	return c.Status(200).JSON(fiber.Map{"message": "Todo deleted successfully"})
}
