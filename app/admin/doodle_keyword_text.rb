ActiveAdmin.register Doodle::Keyword::Text, as: "KeywordText" do
  menu parent: 'Keyword'
  permit_params :name, :value
end
