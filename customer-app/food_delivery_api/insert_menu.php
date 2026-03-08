<?php
// Enable CORS for Flutter app
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

require_once 'db.php';

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

// Validate required fields
if (empty($input['restaurant_id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Restaurant ID is required']);
    exit;
}

if (empty($input['name'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Menu item name is required']);
    exit;
}

if (empty($input['price'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Price is required']);
    exit;
}

try {
    $query = "INSERT INTO menu_items (
        restaurant_id, 
        name, 
        description, 
        price, 
        image_url, 
        category, 
        is_available, 
        preparation_time, 
        rating, 
        review_count
    ) VALUES (
        :restaurant_id, 
        :name, 
        :description, 
        :price, 
        :image_url, 
        :category, 
        :is_available, 
        :preparation_time, 
        :rating, 
        :review_count
    )";
    
    $stmt = $pdo->prepare($query);
    
    $stmt->bindParam(':restaurant_id', $input['restaurant_id'], PDO::PARAM_INT);
    $stmt->bindParam(':name', $input['name'], PDO::PARAM_STR);
    $stmt->bindParam(':description', $input['description'] ?? null, PDO::PARAM_STR);
    $stmt->bindParam(':price', $input['price'], PDO::PARAM_STR);
    $stmt->bindParam(':image_url', $input['image_url'] ?? null, PDO::PARAM_STR);
    $stmt->bindParam(':category', $input['category'] ?? null, PDO::PARAM_STR);
    $stmt->bindParam(':is_available', $input['is_available'] ?? true, PDO::PARAM_BOOL);
    $stmt->bindParam(':preparation_time', $input['preparation_time'] ?? 15, PDO::PARAM_INT);
    $stmt->bindParam(':rating', $input['rating'] ?? 0.00, PDO::PARAM_STR);
    $stmt->bindParam(':review_count', $input['review_count'] ?? 0, PDO::PARAM_INT);
    
    $stmt->execute();
    
    $menuItemId = $pdo->lastInsertId();
    
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'id' => $menuItemId,
        'message' => 'Menu item added successfully'
    ], JSON_PRETTY_PRINT);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>
