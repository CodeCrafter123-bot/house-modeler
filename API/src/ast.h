#pragma once
#include <vector>
#include <string>
#include <memory>

struct Node {
    virtual ~Node() = default;
};

struct Coord {
    int x, y;
};

struct PositionNode : Node {
    Coord a, b;
};

struct WallNode : Node {
    std::string value;
};

struct DoorNode : Node {
    std::unique_ptr<WallNode> wall;
};

struct WindowNode : Node {
    std::unique_ptr<WallNode> wall;
};

struct RoomNode : Node {
    PositionNode position;
    std::vector<std::unique_ptr<DoorNode>> doors;
    std::vector<std::unique_ptr<WindowNode>> windows;
};

struct StairNode : Node {
    PositionNode position;
    std::string direction;
};

struct FloorNode : Node {
    int height;
    std::string color; // empty when the floor has no COLOR line
    std::vector<std::unique_ptr<RoomNode>> rooms;
    std::unique_ptr<StairNode> stair;
};

struct HouseNode : Node {
    std::vector<std::unique_ptr<FloorNode>> floors;
};