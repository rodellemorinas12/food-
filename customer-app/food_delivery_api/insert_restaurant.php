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
if (empty($input['name'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Restaurant name is required']);
    exit;
}

try {
    $query = "INSERT INTO restaurants (
        name, 
        description, 
        cuisine_type, 
        image_url, 
        delivery_fee, 
        address, 
        is_open, 
        status,
        rating, 
        delivery_time, 
        opening_hours, 
        min_order_amount
    ) VALUES (
        :name, 
        :description, 
        :cuisine_type, 
        :image_url, 
        :delivery_fee, 
        :address, 
        :is_open, 
        :status,
        :rating, 
        :delivery_time, 
        :opening_hours, 
        :min_order_amount
    )";
    
    $stmt = $pdo->prepare($query);
    
    $stmt->bindParam(':name', $input['name'], PDO::PARAM_STR);
    $stmt->bindParam(':description', $input['description'] ?? null, PDO::PARAM_STR);
    $stmt->bindParam(':cuisine_type', $input['cuisine_type'] ?? null, PDO::PARAM_STR);
    $stmt->bindParam(':image_url', $input['image_url'] ?? null, PDO::PARAM_STR);
    $stmt->bindParam(':delivery_fee', $input['delivery_fee'] ?? 30.00, PDO::PARAM_STR);
    $stmt->bindParam(':address', $input['address'] ?? null, PDO::PARAM_STR);
    $stmt->bindParam(':is_open', $input['is_open'] ?? true, PDO::PARAM_BOOL);
    $stmt->bindParam(':status', $input['status'] ?? 'active', PDO::PARAM_STR);
    $stmt->bindParam(':rating', $input['rating'] ?? 0.00, PDO::PARAM_STR);
    $stmt->bindParam(':delivery_time', $input['delivery_time'] ?? null, PDO::PARAM_STR);
    $stmt->bindParam(':opening_hours', $input['opening_hours'] ?? null, PDO::PARAM_STR);
    $stmt->bindParam(':min_order_amount', $input['min_order_amount'] ?? 0.00, PDO::PARAM_STR);
    
    $stmt->execute();
    
    $restaurantId = $pdo->lastInsertId();
    
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'id' => $restaurantId,
        'message' => 'Restaurant registered successfully'
    ], JSON_PRETTY_PRINT);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>
