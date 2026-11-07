#include "ast.h"
#include <iostream>
#include <string>

using namespace std;

void printIndent(int depth) {
	for (int i = 0; i < depth; i++) {
		cout << "│   ";
	}
}

//Take the AST and print it in a readable format. This is useful for debugging the parser and semantic analysis.
void printRoom(RoomNode* r, int depth) {
	printIndent(depth);
	cout << "├── POSITION" << endl;

	printIndent(depth);
	cout << "├── DOORS (" << r->doors.size() << ")" << endl;

	printIndent(depth);
	cout << "└── WINDOWS (" << r->windows.size() << ")" << endl;
}

void printFloor(FloorNode* f, int depth) {
	printIndent(depth);
	cout << "└── HEIGHT = " << f->height << endl;

	for (size_t i = 0; i < f->rooms.size(); i++) {
		printIndent(depth);
		cout << "    ├── ROOM" << endl;
		printRoom(f->rooms[i].get(), depth + 2);
	}

	if (f->stair) {
		printIndent(depth);
		cout << "    └── STAIR (" << f->stair->direction << ")" << endl;
	}
}

void printHouse(HouseNode* h, int depth = 0) {
	cout << "root" << endl;

	for (size_t i = 0; i < h->floors.size(); i++) {
		cout << "├── FLOOR" << endl;
		printFloor(h->floors[i].get(), 1);
	}
}

void printDerivationTree(HouseNode* root) {
	if (!root) {
		cout << "[EMPTY TREE]" << endl;
		return;
	}

	printHouse(root);
}