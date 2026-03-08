<?php
// Enable CORS for Flutter app
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'db.php';

// Get query parameters
$restaurantId = $_GET['restaurant_id'] ?? '';
$category = $_GET['category'] ?? '';

// Build query - MUST include image_url for Flutter app to display images
$query = "SELECT 
    id, 
    restaurant_id, 
    name, 
    description, 
    price, 
    image_url, 
    category, 
    is_available, 
    preparation_time, 
    rating, 
    review_count,
    created_at,
    updated_at
FROM menu_items";

$conditions = [];
$params = [];

if (!empty($restaurantId)) {
    $conditions[] = "restaurant_id = :restaurant_id";
    $params[':restaurant_id'] = $restaurantId;
}

if (!empty($category)) {
    $conditions[] = "category = :category";
    $params[':category'] = $category;
}

if (!empty($conditions)) {
    $query .= " WHERE " . implode(" AND ", $conditions);
}

$query .= " ORDER BY category, id";

try {
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $menuItems = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Return JSON response
    header('Content-Type: application/json');
    echo json_encode($menuItems, JSON_PRETTY_PRINT);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>
